import hmac
import hashlib
import json
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Payment, PaymentEvent, Refund
from apps.orders.models import Order
from apps.accounts.models import AuditLog


class RazorpayService:
    @classmethod
    def get_client(cls):
        try:
            import razorpay
            return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        except Exception:
            return None

    @classmethod
    def create_order(cls, order: Order) -> dict:
        """
        Creates Razorpay gateway order. Amount is converted from INR to paise.
        """
        amount_in_paise = int(order.total_amount * 100)
        currency = 'INR'
        receipt = order.order_number

        client = cls.get_client()
        if not client:
            raise ValidationError("Razorpay client is not configured. Please check API credentials.")

        try:
            rp_order = client.order.create({
                'amount': amount_in_paise,
                'currency': currency,
                'receipt': receipt,
                'notes': {'order_number': order.order_number}
            })
            gateway_order_id = rp_order['id']
        except Exception as e:
            raise ValidationError(f"Failed to initiate Razorpay order: {str(e)}")

        # Record or update pending payment record
        Payment.objects.create(
            order=order,
            gateway_order_id=gateway_order_id,
            amount=order.total_amount,
            currency=currency,
            method=Payment.Method.RAZORPAY,
            status=Payment.Status.PENDING
        )

        return {
            'gateway_order_id': gateway_order_id,
            'amount': amount_in_paise,
            'currency': currency,
            'key_id': settings.RAZORPAY_KEY_ID,
            'company_name': 'Prabhakar Agro Mart',
            'order_number': order.order_number,
            'prefill': {
                'name': order.customer.full_name,
                'email': order.customer.email,
                'contact': order.customer.phone or '',
            }
        }

    @classmethod
    def verify_payment(cls, order: Order, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> Payment:
        """
        Cryptographically verifies Razorpay payment HMAC SHA-256 signature.
        Idempotent: if already marked paid, returns payment without re-processing.
        """
        with transaction.atomic():
            payment = Payment.objects.select_for_update().filter(
                order=order,
                gateway_order_id=razorpay_order_id
            ).first()

            if not payment:
                payment = Payment.objects.create(
                    order=order,
                    gateway_order_id=razorpay_order_id,
                    amount=order.total_amount,
                    currency='INR',
                    method=Payment.Method.RAZORPAY,
                    status=Payment.Status.PENDING
                )

            if payment.status == Payment.Status.SUCCESS:
                return payment

            # Cryptographic signature verification
            payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()

            is_valid = hmac.compare_digest(expected_signature, razorpay_signature)
            if not is_valid:
                payment.status = Payment.Status.FAILED
                payment.error_code = 'BAD_SIGNATURE'
                payment.error_desc = 'Razorpay payment signature mismatch'
                payment.save()
                order.payment_status = Order.PaymentStatus.FAILED
                order.save(update_fields=['payment_status'])
                raise ValidationError("Payment signature verification failed.")

            # Payment verified successfully
            payment.payment_id = razorpay_payment_id
            payment.signature = razorpay_signature
            payment.status = Payment.Status.SUCCESS
            payment.save()

            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=['payment_status', 'status'])

            return payment

    @classmethod
    def process_webhook(cls, body_bytes: bytes, signature: str) -> dict:
        """
        Verifies and processes incoming Razorpay webhook payload idempotently.
        """
        if settings.RAZORPAY_WEBHOOK_SECRET:
            expected_sig = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
                body_bytes,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_sig, signature):
                raise ValidationError("Invalid webhook signature.")

        data = json.loads(body_bytes.decode('utf-8'))
        event_id = data.get('event_id') or data.get('id')
        event_type = data.get('event')

        # Idempotency check: if event already processed, return 200 without duplicate action
        if PaymentEvent.objects.filter(event_id=event_id).exists():
            return {'status': 'ignored', 'reason': 'Duplicate event'}

        with transaction.atomic():
            payment_entity = data.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')

            payment = None
            if order_id:
                payment = Payment.objects.filter(gateway_order_id=order_id).first()

            PaymentEvent.objects.create(
                payment=payment,
                event_id=event_id,
                event_type=event_type,
                payload=data
            )

            if event_type == 'payment.captured' and payment:
                if payment.status != Payment.Status.SUCCESS:
                    payment.status = Payment.Status.SUCCESS
                    payment.payment_id = payment_id
                    payment.save()

                    order = payment.order
                    order.payment_status = Order.PaymentStatus.PAID
                    order.status = Order.Status.CONFIRMED
                    order.save(update_fields=['payment_status', 'status'])

            elif event_type == 'payment.failed' and payment:
                payment.status = Payment.Status.FAILED
                payment.error_code = payment_entity.get('error_code', 'PAYMENT_FAILED')
                payment.error_desc = payment_entity.get('error_description', 'Payment failed')
                payment.save()

                order = payment.order
                order.payment_status = Order.PaymentStatus.FAILED
                order.save(update_fields=['payment_status'])

            return {'status': 'processed', 'event': event_type}


class CODService:
    @classmethod
    def confirm_cod_order(cls, order: Order) -> Order:
        """
        Validates COD eligibility (order limit, active configuration) and confirms order.
        Payment status remains PENDING until physical cash collection upon delivery.
        """
        if not settings.COD_ENABLED:
            raise ValidationError("Cash on Delivery is currently disabled.")

        if order.total_amount > Decimal(str(settings.COD_MAX_LIMIT)):
            raise ValidationError(
                f"Cash on Delivery is only available for orders up to ₹{settings.COD_MAX_LIMIT:.2f}. "
                f"Your order total is ₹{order.total_amount:.2f}. Please pay online via UPI or Cards."
            )

        with transaction.atomic():
            Payment.objects.create(
                order=order,
                payment_id=f"COD-{order.order_number}",
                amount=order.total_amount,
                currency='INR',
                method=Payment.Method.COD,
                status=Payment.Status.PENDING
            )

            order.payment_method = Order.PaymentMethod.COD
            order.status = Order.Status.CONFIRMED
            order.payment_status = Order.PaymentStatus.PENDING
            order.save(update_fields=['payment_method', 'status', 'payment_status'])

            return order

    @classmethod
    def mark_cod_collected(cls, order: Order, admin_user) -> Payment:
        """
        Records confirmed cash collection for a COD order.
        """
        with transaction.atomic():
            payment = Payment.objects.filter(order=order, method=Payment.Method.COD).first()
            if not payment:
                payment = Payment.objects.create(
                    order=order,
                    payment_id=f"COD-{order.order_number}",
                    amount=order.total_amount,
                    currency='INR',
                    method=Payment.Method.COD,
                    status=Payment.Status.SUCCESS
                )
            else:
                payment.status = Payment.Status.SUCCESS
                payment.save(update_fields=['status'])

            order.payment_status = Order.PaymentStatus.PAID
            order.save(update_fields=['payment_status'])

            AuditLog.objects.create(
                admin_user=admin_user,
                action='COD_PAYMENT_COLLECTED',
                model_name='Order',
                object_id=order.order_number,
                changes={'amount': str(order.total_amount)}
            )

            return payment
