from django.contrib import admin
from .models import Category, Brand, Product, ProductVariant, ProductImage


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'display_order', 'is_active')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductVariantInline, ProductImageInline]
    list_display = ('name', 'sku', 'brand', 'category', 'product_type', 'is_active', 'is_featured', 'is_bestseller')
    list_filter = ('is_active', 'is_featured', 'is_bestseller', 'category', 'brand', 'product_type')
    search_fields = ('name', 'sku', 'brand__name', 'category__name', 'suitable_crops')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'pack_size', 'pack_unit', 'sku', 'selling_price', 'stock_quantity', 'is_active')
    list_filter = ('pack_unit', 'is_active')
    search_fields = ('sku', 'product__name')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_primary', 'display_order')
    list_filter = ('is_primary',)
