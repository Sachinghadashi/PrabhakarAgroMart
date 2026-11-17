from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage (%)'
        FIXED = 'FIXED', 'Fixed Amount (₹)'

    code = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage value (e.g. 10.00) or fixed amount (e.g. 150.00)")
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Minimum subtotal in INR required to apply")
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cap on discount amount for percentage coupons")

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total overall redemption limit")
    per_customer_limit = models.PositiveIntegerField(default=1, help_text="Maximum times a single customer can use this coupon")
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        val = f"{self.discount_value}%" if self.discount_type == self.DiscountType.PERCENTAGE else f"₹{self.discount_value}"
        return f"{self.code} ({val} off)"

    def is_valid_now(self):
        if not self.is_active:
            return False, "This coupon is no longer active."
        now = timezone.now()
        if self.start_date and now < self.start_date:
            return False, "This coupon is not yet valid."
        if self.end_date and now > self.end_date:
            return False, "This coupon has expired."
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False, "This coupon's maximum usage limit has been reached."
        return True, "Valid"


class CouponRedemption(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='redemptions')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupon_redemptions')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='coupon_redemptions', null=True, blank=True)
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-redeemed_at']

    def __str__(self):
        return f"{self.customer.full_name} used {self.coupon.code} for ₹{self.discount_applied}"
