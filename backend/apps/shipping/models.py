from django.db import models
from apps.orders.models import Order


class Shipment(models.Model):
    class Status(models.TextChoices):
        MANIFESTED = 'MANIFESTED', 'Manifested / Label Created'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        RTO = 'RTO', 'Return to Origin'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    tracking_number = models.CharField(max_length=100, unique=True, db_index=True)
    carrier_name = models.CharField(max_length=100, default='Kisan Logistics Express')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.MANIFESTED)

    shipped_at = models.DateTimeField(null=True, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Shipment {self.tracking_number} for Order {self.order.order_number}"
