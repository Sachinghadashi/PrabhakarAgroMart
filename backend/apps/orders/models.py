import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import User
from apps.catalog.models import ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'PENDING_PAYMENT', 'Pending Payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PROCESSING = 'PROCESSING', 'Processing'
        PACKED = 'PACKED', 'Packed'
        SHIPPED = 'SHIPPED', 'Shipped'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
        RETURN_REQUESTED = 'RETURN_REQUESTED', 'Return Requested'
        RETURNED = 'RETURNED', 'Returned'
        REFUNDED = 'REFUNDED', 'Refunded'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    class PaymentMethod(models.TextChoices):
        RAZORPAY = 'RAZORPAY', 'Razorpay (UPI / Cards / NetBanking)'
        COD = 'COD', 'Cash on Delivery (COD)'

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_PAYMENT, db_index=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.RAZORPAY)

    shipping_address = models.JSONField(help_text="Immutable snapshot of shipping address at checkout")

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    shipping_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    courier_name = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            date_str = timezone.now().strftime('%Y%m%d')
            unique_suffix = uuid.uuid4().hex[:6].upper()
            self.order_number = f"PAM-{date_str}-{unique_suffix}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} - {self.customer.full_name} (₹{self.total_amount})"

    @property
    def can_cancel(self):
        return self.status in [
            self.Status.PENDING_PAYMENT,
            self.Status.CONFIRMED,
            self.Status.PROCESSING
        ]

    # Status Transition Validation Map
    VALID_TRANSITIONS = {
        Status.PENDING_PAYMENT: [Status.CONFIRMED, Status.CANCELLED],
        Status.CONFIRMED: [Status.PROCESSING, Status.CANCELLED],
        Status.PROCESSING: [Status.PACKED, Status.CANCELLED],
        Status.PACKED: [Status.SHIPPED, Status.CANCELLED],
        Status.SHIPPED: [Status.OUT_FOR_DELIVERY],
        Status.OUT_FOR_DELIVERY: [Status.DELIVERED, Status.CANCELLED],
        Status.DELIVERED: [Status.RETURN_REQUESTED],
        Status.RETURN_REQUESTED: [Status.RETURNED, Status.CANCELLED],
        Status.RETURNED: [Status.REFUNDED],
        Status.CANCELLED: [],
        Status.REFUNDED: [],
    }

    def can_transition_to(self, target_status: str) -> bool:
        allowed = self.VALID_TRANSITIONS.get(self.status, [])
        return target_status in allowed


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='order_items')
    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=70)
    pack_size = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} ({self.pack_size}) for Order {self.order.order_number}"
