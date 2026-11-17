from decimal import Decimal
from django.core.exceptions import ValidationError
from .models import Coupon, CouponRedemption


class CouponService:
    @staticmethod
    def validate_and_calculate_discount(code: str, user, subtotal: Decimal) -> tuple[Coupon, Decimal]:
        """
        Validates coupon eligibility against user and subtotal.
        Returns (coupon_instance, calculated_discount_amount).
        Raises ValidationError on failure.
        """
        if not code:
            raise ValidationError("Coupon code is required.")

        try:
            coupon = Coupon.objects.get(code=code.upper().strip())
        except Coupon.DoesNotExist:
            raise ValidationError("Invalid coupon code.")

        is_valid, msg = coupon.is_valid_now()
        if not is_valid:
            raise ValidationError(msg)

        if subtotal < coupon.min_order_value:
            raise ValidationError(
                f"Coupon requires a minimum order subtotal of ₹{coupon.min_order_value:.2f}. Your subtotal is ₹{subtotal:.2f}."
            )

        # Check per-customer redemption limit
        if user and user.is_authenticated:
            user_redemptions = CouponRedemption.objects.filter(coupon=coupon, customer=user).count()
            if user_redemptions >= coupon.per_customer_limit:
                raise ValidationError("You have already used this coupon the maximum allowed times.")

        # Calculate discount
        if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
            discount = (subtotal * coupon.discount_value) / Decimal('100.00')
            if coupon.max_discount is not None and discount > coupon.max_discount:
                discount = coupon.max_discount
        else:
            discount = coupon.discount_value

        # Discount cannot exceed subtotal
        discount = min(discount, subtotal)
        return coupon, discount.quantize(Decimal('0.01'))
