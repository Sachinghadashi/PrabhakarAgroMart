import pytest
import hmac
import hashlib
from decimal import Decimal
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, Address
from apps.catalog.models import Category, Brand, Product, ProductVariant
from apps.inventory.models import Inventory, InventoryTransaction
from apps.inventory.services import InventoryService
from apps.cart.services import CartService
from apps.orders.models import Order
from apps.orders.services import OrderService
from apps.payments.models import Payment, PaymentEvent
from apps.payments.services import RazorpayService, CODService
from apps.promotions.models import Coupon


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(
        email='testfarmer@prabhakar.com',
        password='TestFarmer@123',
        full_name='Test Farmer Ramesh',
        phone='+919876543299',
        role=User.Role.CUSTOMER
    )
    return user


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        email='testadmin@prabhakar.com',
        password='TestAdmin@123',
        full_name='Test Admin Officer',
        phone='+919876543288'
    )
    return user


@pytest.fixture
def sample_catalog(db):
    cat = Category.objects.create(name='Pesticides Test', slug='pesticides-test')
    brand = Brand.objects.create(name='Kisan Care', slug='kisan-care')
    product = Product.objects.create(
        name='Bio Shield Pest Protector',
        slug='bio-shield-pest-protector',
        brand=brand,
        category=cat,
        sku='BIO-SHIELD-01',
        description='Eco-friendly neem-based pest control',
        suitable_crops='Paddy, Cotton, Tomato'
    )
    variant = ProductVariant.objects.create(
        product=product,
        pack_size=Decimal('1.00'),
        pack_unit=ProductVariant.Unit.LTR,
        sku='BIO-SHIELD-1L',
        original_price=Decimal('500.00'),
        selling_price=Decimal('450.00'),
        stock_quantity=50
    )
    inv = Inventory.objects.create(variant=variant, current_stock=50, reserved_stock=0)
    return {'product': product, 'variant': variant, 'inventory': inv, 'category': cat, 'brand': brand}


@pytest.mark.django_db
class TestAuthenticationAndPermissions:
    def test_customer_registration(self, api_client):
        url = reverse('auth_register')
        data = {
            'email': 'newfarmer@prabhakar.com',
            'password': 'SecurePassword@123',
            'password_confirmation': 'SecurePassword@123',
            'full_name': 'Santosh Shinde',
            'phone': '+919812345678'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        assert User.objects.filter(email='newfarmer@prabhakar.com').exists()

    def test_customer_cannot_access_admin_portal(self, api_client, customer_user):
        url = reverse('admin_login')
        data = {'email': customer_user.email, 'password': 'TestFarmer@123'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == 403


@pytest.mark.django_db
class TestInventoryLockingAndReservation:
    def test_stock_reservation_success(self, sample_catalog):
        variant = sample_catalog['variant']
        success = InventoryService.reserve_stock(variant, 10, 'PAM-TEST-001')
        assert success is True

        inv = Inventory.objects.get(variant=variant)
        assert inv.reserved_stock == 10
        assert inv.available_stock == 40

    def test_insufficient_stock_raises_error(self, sample_catalog):
        variant = sample_catalog['variant']
        with pytest.raises(Exception):
            InventoryService.reserve_stock(variant, 60, 'PAM-TEST-OVERFLOW')

    def test_release_stock_on_cancellation(self, sample_catalog):
        variant = sample_catalog['variant']
        InventoryService.reserve_stock(variant, 15, 'PAM-TEST-002')
        InventoryService.release_stock(variant, 15, 'PAM-TEST-002', reason='Test Cancel')

        inv = Inventory.objects.get(variant=variant)
        assert inv.reserved_stock == 0
        assert inv.available_stock == 50


@pytest.mark.django_db
class TestCartAndCheckoutCalculation:
    def test_authoritative_price_calculation(self, customer_user, sample_catalog):
        variant = sample_catalog['variant']
        cart = CartService.get_or_create_cart(customer_user)
        CartService.add_to_cart(cart, variant, 2)

        summary = CartService.calculate_cart_summary(cart)
        # 2 units * 450 = 900 subtotal (< 999 so 99 shipping fee applies)
        assert Decimal(summary['subtotal']) == Decimal('900.00')
        assert Decimal(summary['shipping_fee']) == Decimal('99.00')
        # 5% GST on 900 = 45.00
        assert Decimal(summary['tax_amount']) == Decimal('45.00')
        # Total = 900 + 99 + 45 = 1044.00
        assert Decimal(summary['total_amount']) == Decimal('1044.00')

    def test_checkout_creates_order_and_reserves_stock(self, customer_user, sample_catalog):
        variant = sample_catalog['variant']
        cart = CartService.get_or_create_cart(customer_user)
        CartService.add_to_cart(cart, variant, 2)

        address = Address.objects.create(
            user=customer_user,
            recipient_name='Test Farmer Ramesh',
            phone='+919876543299',
            address_line1='Farm Gate 4',
            village_town='Baramati',
            district='Pune',
            state='Maharashtra',
            pin_code='413102'
        )

        order = OrderService.create_order_from_cart(customer_user, address.id)
        assert order.order_number.startswith('PAM-')
        assert order.status == Order.Status.PENDING_PAYMENT
        assert order.items.count() == 1

        # Check that stock was atomically reserved
        inv = Inventory.objects.get(variant=variant)
        assert inv.reserved_stock == 2
        assert inv.available_stock == 48

        # Cart should be cleared after checkout
        assert cart.items.count() == 0


@pytest.mark.django_db
class TestRazorpayAndCOD:
    def test_razorpay_signature_verification(self, customer_user, sample_catalog):
        variant = sample_catalog['variant']
        cart = CartService.get_or_create_cart(customer_user)
        CartService.add_to_cart(cart, variant, 1)

        address = Address.objects.create(
            user=customer_user,
            recipient_name='Test Farmer Ramesh',
            phone='+919876543299',
            address_line1='Farm Gate 4',
            village_town='Baramati',
            district='Pune',
            state='Maharashtra',
            pin_code='413102'
        )

        order = OrderService.create_order_from_cart(customer_user, address.id)
        rzp_data = RazorpayService.create_order(order)
        gateway_order_id = rzp_data['gateway_order_id']
        razorpay_payment_id = 'pay_sample_test_123'

        # Generate genuine HMAC SHA256 signature
        payload = f"{gateway_order_id}|{razorpay_payment_id}".encode('utf-8')
        valid_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()

        payment = RazorpayService.verify_payment(
            order, gateway_order_id, razorpay_payment_id, valid_signature
        )
        assert payment.status == Payment.Status.SUCCESS

        order.refresh_from_db()
        assert order.payment_status == Order.PaymentStatus.PAID
        assert order.status == Order.Status.CONFIRMED

    def test_cod_confirmation_within_limit(self, customer_user, sample_catalog):
        variant = sample_catalog['variant']
        cart = CartService.get_or_create_cart(customer_user)
        CartService.add_to_cart(cart, variant, 1)

        address = Address.objects.create(
            user=customer_user,
            recipient_name='Test Farmer Ramesh',
            phone='+919876543299',
            address_line1='Farm Gate 4',
            village_town='Baramati',
            district='Pune',
            state='Maharashtra',
            pin_code='413102'
        )

        order = OrderService.create_order_from_cart(
            customer_user, address.id, payment_method=Order.PaymentMethod.COD
        )
        confirmed_order = CODService.confirm_cod_order(order)
        assert confirmed_order.payment_method == Order.PaymentMethod.COD
        assert confirmed_order.status == Order.Status.CONFIRMED
        # Payment remains pending until delivery collection
        assert confirmed_order.payment_status == Order.PaymentStatus.PENDING
