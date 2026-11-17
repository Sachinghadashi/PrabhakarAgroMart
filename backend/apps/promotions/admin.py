from django.contrib import admin
from .models import Coupon, CouponRedemption


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'min_order_value', 'times_used', 'usage_limit', 'is_active', 'end_date')
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code', 'description')


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ('coupon', 'customer', 'order', 'discount_applied', 'redeemed_at')
    search_fields = ('coupon__code', 'customer__email', 'order__order_number')
    readonly_fields = ('coupon', 'customer', 'order', 'discount_applied', 'redeemed_at')
