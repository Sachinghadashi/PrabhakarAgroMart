from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Order, OrderItem
from apps.accounts.models import Address, AuditLog
from apps.cart.services import CartService
from apps.inventory.services import InventoryService
from apps.promotions.models import CouponRedemption


class OrderService:
    @classmethod
    def create_order_from_cart(cls, user, address_id: int, payment_method: str = Order.PaymentMethod.RAZORPAY, notes: str = None) -> Order:
        """
        Atomically checkout cart, reserve inventory, snapshot addresses and prices,
        and generate a pending Order.
        """
        cart = CartService.get_or_create_cart(user)
        items = list(cart.items.select_related('variant', 'variant__product', 'variant__inventory').all())

        if not items:
            raise ValidationError("Your shopping cart is empty.")

        try:
            address = Address.objects.get(pk=address_id, user=user)
        except Address.DoesNotExist:
            raise ValidationError("Selected delivery address was not found.")

        # Address snapshot
        address_snapshot = {
            'recipient_name': address.recipient_name,
            'phone': address.phone,
            'address_line1': address.address_line1,
            'address_line2': address.address_line2,
            'village_town': address.village_town,
            'district': address.district,
            'state': address.state,
            'pin_code': address.pin_code,
            'delivery_instructions': address.delivery_instructions,
            'address_type': address.address_type,
        }

        # Calculate authoritative numbers
        summary = CartService.calculate_cart_summary(cart)
        if summary['has_out_of_stock']:
            raise ValidationError("One or more items in your cart are currently out of stock or inactive.")

        subtotal = Decimal(summary['subtotal'])
        discount = Decimal(summary['coupon_discount'])
        shipping = Decimal(summary['shipping_fee'])
        tax = Decimal(summary['tax_amount'])
        total = Decimal(summary['total_amount'])

        with transaction.atomic():
            # Create Order
            order = Order.objects.create(
                customer=user,
                status=Order.Status.PENDING_PAYMENT,
                payment_status=Order.PaymentStatus.PENDING,
                payment_method=payment_method,
                shipping_address=address_snapshot,
                subtotal=subtotal,
                discount_amount=discount,
                shipping_charge=shipping,
                tax_amount=tax,
                total_amount=total,
                notes=notes
            )

            # Create OrderItems and Reserve Inventory
            for item in items:
                v = item.variant
                # Atomically reserve inventory
                InventoryService.reserve_stock(
                    variant=v,
                    quantity=item.quantity,
                    order_number=order.order_number
                )

                OrderItem.objects.create(
                    order=order,
                    variant=v,
                    product_name=v.product.name,
                    sku=v.sku,
                    pack_size=f"{v.pack_size} {v.pack_unit}",
                    unit_price=v.selling_price,
                    quantity=item.quantity,
                    total_price=(v.selling_price * item.quantity).quantize(Decimal('0.01'))
                )

            # Record coupon redemption if coupon was applied
            if cart.coupon and discount > 0:
                CouponRedemption.objects.create(
                    coupon=cart.coupon,
                    customer=user,
                    order=order,
                    discount_applied=discount
                )
                cart.coupon.times_used += 1
                cart.coupon.save(update_fields=['times_used'])

            # Clear cart items upon successful order generation
            CartService.clear_cart(cart)

            return order

    @classmethod
    def cancel_order(cls, order: Order, user, reason: str = None) -> Order:
        """
        Cancels an eligible order and releases reserved inventory atomically.
        """
        if not order.can_cancel:
            raise ValidationError(f"Order {order.order_number} cannot be cancelled from status {order.get_status_display()}.")

        with transaction.atomic():
            order.status = Order.Status.CANCELLED
            order.save(update_fields=['status'])

            # Release reserved inventory for each item
            for item in order.items.all():
                InventoryService.release_stock(
                    variant=item.variant,
                    quantity=item.quantity,
                    order_number=order.order_number,
                    reason=f"Order Cancelled: {reason or 'Customer request'}"
                )

            AuditLog.objects.create(
                admin_user=user if user.is_admin_user else None,
                action='ORDER_CANCELLED',
                model_name='Order',
                object_id=order.order_number,
                changes={'status': Order.Status.CANCELLED, 'reason': reason}
            )

            return order

    @classmethod
    def transition_status(cls, order: Order, target_status: str, admin_user, tracking_number: str = None, courier_name: str = None) -> Order:
        """
        Validates and transitions order status for admin fulfillment.
        When moving to SHIPPED/PACKED, final stock deduction is committed.
        """
        if not order.can_transition_to(target_status):
            raise ValidationError(
                f"Invalid status transition from {order.get_status_display()} to {target_status}."
            )

        old_status = order.status
        with transaction.atomic():
            order.status = target_status
            if tracking_number:
                order.tracking_number = tracking_number
            if courier_name:
                order.courier_name = courier_name
            order.save()

            # If order is shipped or packed, commit deduction from current stock if not already committed
            if target_status in [Order.Status.PACKED, Order.Status.SHIPPED] and old_status in [Order.Status.CONFIRMED, Order.Status.PROCESSING]:
                for item in order.items.all():
                    InventoryService.commit_deduction(
                        variant=item.variant,
                        quantity=item.quantity,
                        order_number=order.order_number
                    )

            AuditLog.objects.create(
                admin_user=admin_user,
                action='ORDER_STATUS_TRANSITION',
                model_name='Order',
                object_id=order.order_number,
                changes={'from': old_status, 'to': target_status, 'tracking_number': tracking_number}
            )

            return order
