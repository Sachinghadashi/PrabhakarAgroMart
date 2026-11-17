from django.db import models
from apps.catalog.models import ProductVariant
from apps.accounts.models import User


class Inventory(models.Model):
    variant = models.OneToOneField(ProductVariant, on_delete=models.CASCADE, related_name='inventory')
    current_stock = models.PositiveIntegerField(default=0)
    reserved_stock = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Inventories'

    @property
    def available_stock(self):
        return max(0, self.current_stock - self.reserved_stock)

    def __str__(self):
        return f"{self.variant.sku} - Current: {self.current_stock}, Reserved: {self.reserved_stock}, Avail: {self.available_stock}"


class InventoryTransaction(models.Model):
    class TransactionType(models.TextChoices):
        STOCK_IN = 'STOCK_IN', 'Stock In (Purchase/Restock)'
        STOCK_OUT = 'STOCK_OUT', 'Stock Out (Sale Fulfilled)'
        RESERVED = 'RESERVED', 'Stock Reserved (Order Pending)'
        RELEASED = 'RELEASED', 'Stock Released (Order Cancelled/Expired)'
        ADJUSTMENT = 'ADJUSTMENT', 'Manual Adjustment'

    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='inventory_transactions')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    quantity = models.IntegerField(help_text="Positive for addition, negative for deduction")
    reason = models.CharField(max_length=255)
    reference_order = models.CharField(max_length=60, null=True, blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} | {self.variant.sku} | {self.transaction_type} | {self.quantity}"
