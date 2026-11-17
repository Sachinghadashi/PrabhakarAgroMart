from rest_framework import serializers
from .models import Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'order', 'order_number', 'tracking_number', 'carrier_name',
            'status', 'shipped_at', 'estimated_delivery', 'delivered_at', 'created_at'
        ]


class ServiceabilityCheckSerializer(serializers.Serializer):
    pincode = serializers.CharField(max_length=6, min_length=6)

    def validate_pincode(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("PIN code must be a 6-digit number.")
        return value
