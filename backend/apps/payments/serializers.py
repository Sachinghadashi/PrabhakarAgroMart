from rest_framework import serializers
from .models import Payment, Refund


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'payment_id', 'gateway_order_id', 'method',
            'amount', 'currency', 'status', 'error_code', 'error_desc', 'created_at'
        ]


class CreateRazorpayOrderSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)


class VerifyRazorpayPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)
    razorpay_order_id = serializers.CharField(max_length=100, required=True)
    razorpay_payment_id = serializers.CharField(max_length=100, required=True)
    razorpay_signature = serializers.CharField(max_length=255, required=True)


class ConfirmCODSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)


class MarkCODCollectedSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ['id', 'order', 'payment', 'refund_id', 'amount', 'reason', 'status', 'approved_by', 'created_at']
