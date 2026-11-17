from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Inventory, InventoryTransaction
from apps.catalog.models import ProductVariant


class InventoryService:
    @staticmethod
    def get_or_create_inventory(variant: ProductVariant) -> Inventory:
        inv, created = Inventory.objects.get_or_create(
            variant=variant,
            defaults={'current_stock': variant.stock_quantity, 'reserved_stock': 0}
        )
        return inv

    @classmethod
    def reserve_stock(cls, variant: ProductVariant, quantity: int, order_number: str = None) -> bool:
        """
        Atomically reserve stock for an order using pessimistic database row locking.
        Throws ValidationError if available stock is insufficient.
        """
        if quantity <= 0:
            raise ValidationError("Quantity to reserve must be greater than zero.")

        with transaction.atomic():
            inv = Inventory.objects.select_for_update().get_or_create(
                variant=variant,
                defaults={'current_stock': variant.stock_quantity, 'reserved_stock': 0}
            )[0]

            available = inv.current_stock - inv.reserved_stock
            if available < quantity:
                raise ValidationError(
                    f"Insufficient stock for {variant.product.name} ({variant.pack_size} {variant.pack_unit}). Available: {available}, Requested: {quantity}"
                )

            inv.reserved_stock += quantity
            inv.save()

            InventoryTransaction.objects.create(
                variant=variant,
                transaction_type=InventoryTransaction.TransactionType.RESERVED,
                quantity=quantity,
                reason=f"Reserved for Order {order_number or 'Pending'}",
                reference_order=order_number
            )
            return True

    @classmethod
    def release_stock(cls, variant: ProductVariant, quantity: int, order_number: str = None, reason: str = None) -> bool:
        """
        Atomically release previously reserved stock (e.g. order cancelled, payment expired).
        """
        if quantity <= 0:
            return False

        with transaction.atomic():
            inv = Inventory.objects.select_for_update().get_or_create(
                variant=variant,
                defaults={'current_stock': variant.stock_quantity, 'reserved_stock': 0}
            )[0]

            inv.reserved_stock = max(0, inv.reserved_stock - quantity)
            inv.save()

            InventoryTransaction.objects.create(
                variant=variant,
                transaction_type=InventoryTransaction.TransactionType.RELEASED,
                quantity=-quantity,
                reason=reason or f"Released reservation for Order {order_number or 'Pending'}",
                reference_order=order_number
            )
            return True

    @classmethod
    def commit_deduction(cls, variant: ProductVariant, quantity: int, order_number: str = None) -> bool:
        """
        Atomically commit fulfillment: deduct from both current_stock and reserved_stock.
        Syncs variant.stock_quantity.
        """
        with transaction.atomic():
            inv = Inventory.objects.select_for_update().get_or_create(
                variant=variant,
                defaults={'current_stock': variant.stock_quantity, 'reserved_stock': 0}
            )[0]

            inv.current_stock = max(0, inv.current_stock - quantity)
            inv.reserved_stock = max(0, inv.reserved_stock - quantity)
            inv.save()

            # Keep catalog variant stock quantity in sync
            variant.stock_quantity = inv.current_stock
            variant.save(update_fields=['stock_quantity'])

            InventoryTransaction.objects.create(
                variant=variant,
                transaction_type=InventoryTransaction.TransactionType.STOCK_OUT,
                quantity=-quantity,
                reason=f"Fulfilled sale for Order {order_number or 'Direct'}",
                reference_order=order_number
            )
            return True

    @classmethod
    def manual_adjustment(cls, variant: ProductVariant, quantity_diff: int, reason: str, user=None) -> Inventory:
        """
        Manual stock-in or stock-out adjustment performed by inventory manager.
        """
        if not reason or not reason.strip():
            raise ValidationError("Mandatory reason required for manual inventory adjustment.")

        with transaction.atomic():
            inv = Inventory.objects.select_for_update().get_or_create(
                variant=variant,
                defaults={'current_stock': variant.stock_quantity, 'reserved_stock': 0}
            )[0]

            new_stock = inv.current_stock + quantity_diff
            if new_stock < 0:
                raise ValidationError(f"Adjustment would result in negative stock ({new_stock}).")

            inv.current_stock = new_stock
            inv.save()

            variant.stock_quantity = new_stock
            variant.save(update_fields=['stock_quantity'])

            InventoryTransaction.objects.create(
                variant=variant,
                transaction_type=InventoryTransaction.TransactionType.ADJUSTMENT,
                quantity=quantity_diff,
                reason=reason,
                performed_by=user
            )
            return inv
