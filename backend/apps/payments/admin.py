from django.contrib import admin
from .models import Payment, PaymentEvent, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'payment_id', 'gateway_order_id', 'method', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('method', 'status', 'currency')
    search_fields = ('payment_id', 'gateway_order_id', 'order__order_number')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'event_type', 'payment', 'processed_at')
    search_fields = ('event_id', 'event_type')
    readonly_fields = ('event_id', 'event_type', 'payment', 'payload', 'processed_at')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('refund_id', 'order', 'amount', 'status', 'approved_by', 'created_at')
    list_filter = ('status',)
    search_fields = ('refund_id', 'order__order_number')
