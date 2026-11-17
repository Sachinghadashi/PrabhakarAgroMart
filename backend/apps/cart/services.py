from decimal import Decimal
from django.core.exceptions import ValidationError
from .models import Cart, CartItem
from apps.catalog.models import ProductVariant
from apps.promotions.services import CouponService


class CartService:
    FREE_SHIPPING_THRESHOLD = Decimal('999.00')
    STANDARD_SHIPPING_FEE = Decimal('99.00')
    GST_RATE = Decimal('0.05')  # 5% agricultural input GST

    @classmethod
    def get_or_create_cart(cls, user) -> Cart:
        cart, _ = Cart.objects.get_or_create(customer=user)
        return cart

    @classmethod
    def calculate_cart_summary(cls, cart: Cart) -> dict:
        """
        Calculates authoritative cart summary strictly server-side.
        Returns subtotal, discount, shipping, tax, total, and item breakdowns.
        """
        items = cart.items.select_related('variant', 'variant__product', 'variant__inventory').all()

        subtotal = Decimal('0.00')
        item_list = []
        has_out_of_stock = False

        for item in items:
            v = item.variant
            # Check availability
            inv = getattr(v, 'inventory', None)
            available = inv.available_stock if inv else v.stock_quantity
            is_available = available >= item.quantity

            if not is_available or not v.is_active or not v.product.is_active:
                has_out_of_stock = True

            line_total = (v.selling_price * item.quantity).quantize(Decimal('0.01'))
            subtotal += line_total

            item_list.append({
                'id': item.id,
                'variant_id': v.id,
                'product_id': v.product.id,
                'product_name': v.product.name,
                'product_slug': v.product.slug,
                'brand_name': v.product.brand.name,
                'sku': v.sku,
                'pack_size': str(v.pack_size),
                'pack_unit': v.pack_unit,
                'unit_price': str(v.selling_price),
                'original_price': str(v.original_price) if v.original_price else None,
                'quantity': item.quantity,
                'line_total': str(line_total),
                'available_stock': available,
                'is_available': is_available,
                'primary_image': v.product.primary_image_url,
            })

        subtotal = subtotal.quantize(Decimal('0.01'))

        # Calculate Coupon Discount
        discount = Decimal('0.00')
        coupon_code = None
        coupon_error = None

        if cart.coupon:
            try:
                _, discount = CouponService.validate_and_calculate_discount(
                    cart.coupon.code, cart.customer, subtotal
                )
                coupon_code = cart.coupon.code
            except ValidationError as e:
                coupon_error = str(e.message if hasattr(e, 'message') else e)
                # Invalidate expired/ineligible coupon from cart
                cart.coupon = None
                cart.save(update_fields=['coupon'])

        discount = discount.quantize(Decimal('0.01'))
        discounted_subtotal = max(Decimal('0.00'), subtotal - discount)

        # Shipping charge calculation
        if subtotal == Decimal('0.00') or discounted_subtotal >= cls.FREE_SHIPPING_THRESHOLD:
            shipping_fee = Decimal('0.00')
        else:
            shipping_fee = cls.STANDARD_SHIPPING_FEE

        # Tax calculation (5% GST on discounted subtotal)
        tax = (discounted_subtotal * cls.GST_RATE).quantize(Decimal('0.01'))

        # Final payable amount
        total = (discounted_subtotal + shipping_fee + tax).quantize(Decimal('0.01'))

        return {
            'cart_id': cart.id,
            'items': item_list,
            'total_items_count': sum(i['quantity'] for i in item_list),
            'subtotal': str(subtotal),
            'coupon_code': coupon_code,
            'coupon_discount': str(discount),
            'coupon_error': coupon_error,
            'shipping_fee': str(shipping_fee),
            'free_shipping_threshold': str(cls.FREE_SHIPPING_THRESHOLD),
            'qualifies_for_free_shipping': discounted_subtotal >= cls.FREE_SHIPPING_THRESHOLD,
            'tax_amount': str(tax),
            'total_amount': str(total),
            'has_out_of_stock': has_out_of_stock,
        }

    @classmethod
    def add_to_cart(cls, cart: Cart, variant: ProductVariant, quantity: int = 1) -> CartItem:
        if quantity <= 0:
            raise ValidationError("Quantity must be at least 1.")

        if not variant.is_active or not variant.product.is_active:
            raise ValidationError("This product is currently inactive.")

        inv = getattr(variant, 'inventory', None)
        available = inv.available_stock if inv else variant.stock_quantity

        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        target_qty = quantity if created else (item.quantity + quantity)

        if available < target_qty:
            raise ValidationError(
                f"Cannot add {quantity} units. Only {available} available in stock."
            )

        item.quantity = target_qty
        item.save()
        return item

    @classmethod
    def update_quantity(cls, cart: Cart, item_id: int, quantity: int) -> CartItem:
        try:
            item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            raise ValidationError("Item does not exist in cart.")

        if quantity <= 0:
            item.delete()
            return None

        v = item.variant
        inv = getattr(v, 'inventory', None)
        available = inv.available_stock if inv else v.stock_quantity

        if available < quantity:
            raise ValidationError(
                f"Requested quantity {quantity} exceeds available stock of {available}."
            )

        item.quantity = quantity
        item.save()
        return item

    @classmethod
    def remove_item(cls, cart: Cart, item_id: int) -> bool:
        CartItem.objects.filter(pk=item_id, cart=cart).delete()
        return True

    @classmethod
    def clear_cart(cls, cart: Cart) -> bool:
        cart.items.all().delete()
        cart.coupon = None
        cart.save()
        return True

    @classmethod
    def apply_coupon(cls, cart: Cart, code: str):
        summary = cls.calculate_cart_summary(cart)
        subtotal = Decimal(summary['subtotal'])
        coupon, _ = CouponService.validate_and_calculate_discount(code, cart.customer, subtotal)
        cart.coupon = coupon
        cart.save(update_fields=['coupon'])
        return coupon

    @classmethod
    def remove_coupon(cls, cart: Cart):
        cart.coupon = None
        cart.save(update_fields=['coupon'])
