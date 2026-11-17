from rest_framework import serializers
from .models import Coupon, CouponRedemption


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_order_value', 'max_discount', 'start_date', 'end_date',
            'usage_limit', 'per_customer_limit', 'times_used', 'is_active',
            'is_valid', 'created_at'
        ]

    def get_is_valid(self, obj):
        valid, _ = obj.is_valid_now()
        return valid


class ValidateCouponInputSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
