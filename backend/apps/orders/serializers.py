from rest_framework import serializers
from .models import Order, OrderItem
from apps.accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'variant', 'product_name', 'sku', 'pack_size',
            'unit_price', 'quantity', 'total_price'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'status', 'payment_status', 'payment_method',
            'subtotal', 'discount_amount', 'shipping_charge', 'tax_amount', 'total_amount',
            'items_count', 'tracking_number', 'courier_name', 'created_at'
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    can_cancel = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'payment_status',
            'payment_method', 'shipping_address', 'subtotal', 'discount_amount',
            'shipping_charge', 'tax_amount', 'total_amount', 'items',
            'tracking_number', 'courier_name', 'notes', 'can_cancel',
            'created_at', 'updated_at'
        ]


class CheckoutInputSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.RAZORPAY
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class OrderStatusTransitionSerializer(serializers.Serializer):
    target_status = serializers.ChoiceField(choices=Order.Status.choices)
    tracking_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    courier_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
