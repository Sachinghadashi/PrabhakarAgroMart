from django.contrib import admin
from .models import Shipment


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'order', 'carrier_name', 'status', 'shipped_at', 'delivered_at')
    list_filter = ('status', 'carrier_name')
    search_fields = ('tracking_number', 'order__order_number')
