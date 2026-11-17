from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'display_order', 'is_active', 'subcategories', 'products_count'
        ]

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.filter(is_active=True), many=True).data
        return []

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class BrandSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description', 'is_active', 'products_count']

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'external_url', 'image_url', 'alt_text', 'is_primary', 'display_order']

    def get_image_url(self, obj):
        return obj.image_url


class ProductVariantSerializer(serializers.ModelSerializer):
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'pack_size', 'pack_unit', 'sku', 'barcode',
            'original_price', 'selling_price', 'stock_quantity',
            'low_stock_threshold', 'is_active', 'discount_percent', 'in_stock'
        ]
        read_only_fields = ['id', 'discount_percent', 'in_stock']


class ProductListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    primary_image = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    starting_price = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'brand_name',
            'category', 'category_name', 'category_slug',
            'sku', 'product_type', 'suitable_crops',
            'is_active', 'is_featured', 'is_bestseller',
            'primary_image', 'variants', 'starting_price', 'created_at'
        ]

    def get_primary_image(self, obj):
        return obj.primary_image_url


class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'category', 'sku', 'barcode',
            'description', 'specifications', 'usage_instructions', 'safety_info',
            'suitable_crops', 'product_type', 'is_active', 'is_featured',
            'is_bestseller', 'images', 'variants', 'related_products', 'created_at'
        ]

    def get_related_products(self, obj):
        related = Product.objects.filter(
            category=obj.category,
            is_active=True
        ).exclude(id=obj.id).prefetch_related('variants', 'images')[:4]
        return ProductListSerializer(related, many=True).data
