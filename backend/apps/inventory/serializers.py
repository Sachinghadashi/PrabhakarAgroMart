from rest_framework import serializers
from .models import Inventory, InventoryTransaction
from apps.catalog.serializers import ProductVariantSerializer


class InventorySerializer(serializers.ModelSerializer):
    variant_details = ProductVariantSerializer(source='variant', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    sku = serializers.CharField(source='variant.sku', read_only=True)
    pack_display = serializers.SerializerMethodField()
    available_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.SerializerMethodField()
    is_out_of_stock = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = [
            'id', 'variant', 'variant_details', 'product_name', 'sku',
            'pack_display', 'current_stock', 'reserved_stock',
            'available_stock', 'is_low_stock', 'is_out_of_stock', 'updated_at'
        ]

    def get_pack_display(self, obj):
        return f"{obj.variant.pack_size} {obj.variant.pack_unit}"

    def get_is_low_stock(self, obj):
        return 0 < obj.available_stock <= obj.variant.low_stock_threshold

    def get_is_out_of_stock(self, obj):
        return obj.available_stock <= 0


class InventoryAdjustmentSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(required=True)
    quantity_diff = serializers.IntegerField(required=True)
    reason = serializers.CharField(max_length=255, required=True)


class InventoryTransactionSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source='variant.sku', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.full_name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'variant', 'variant_sku', 'product_name', 'transaction_type',
            'quantity', 'reason', 'reference_order', 'performed_by',
            'performed_by_name', 'created_at'
        ]
