from django.contrib import admin
from .models import Inventory, InventoryTransaction


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('variant', 'current_stock', 'reserved_stock', 'available_stock', 'updated_at')
    search_fields = ('variant__sku', 'variant__product__name')
    readonly_fields = ('reserved_stock', 'updated_at')


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'variant', 'transaction_type', 'quantity', 'reason', 'reference_order', 'performed_by')
    list_filter = ('transaction_type',)
    search_fields = ('variant__sku', 'reference_order', 'reason')
    readonly_fields = ('variant', 'transaction_type', 'quantity', 'reason', 'reference_order', 'performed_by', 'created_at')
