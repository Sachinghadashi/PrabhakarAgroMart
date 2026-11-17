from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter
from .models import Category, Brand, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductVariantSerializer,
    ProductImageSerializer,
)
from apps.accounts.permissions import IsProductManagerOrAbove


class ProductFilter(FilterSet):
    min_price = NumberFilter(field_name='variants__selling_price', lookup_expr='gte', distinct=True)
    max_price = NumberFilter(field_name='variants__selling_price', lookup_expr='lte', distinct=True)
    category_slug = CharFilter(field_name='category__slug')
    brand_slug = CharFilter(field_name='brand__slug')
    crop = CharFilter(field_name='suitable_crops', lookup_expr='icontains')
    product_type = CharFilter(field_name='product_type')

    class Meta:
        model = Product
        fields = ['category', 'category_slug', 'brand', 'brand_slug', 'is_featured', 'is_bestseller', 'product_type', 'crop']


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsProductManagerOrAbove()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return Category.objects.all().prefetch_related('subcategories', 'products')
        # Only top-level active categories for public list, subcategories nested
        return Category.objects.filter(is_active=True, parent__isnull=True).prefetch_related('subcategories', 'products')


class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsProductManagerOrAbove()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return Brand.objects.all()
        return Brand.objects.filter(is_active=True)


class ProductViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'sku', 'brand__name', 'category__name', 'description', 'suitable_crops']
    ordering_fields = ['created_at', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsProductManagerOrAbove()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.all().select_related('brand', 'category').prefetch_related('variants', 'images')
        if not (user.is_authenticated and user.is_admin_user):
            queryset = queryset.filter(is_active=True)

        # Custom sorting for price
        ordering = self.request.query_params.get('ordering')
        if ordering == 'price_asc':
            queryset = queryset.order_by('variants__selling_price').distinct()
        elif ordering == 'price_desc':
            queryset = queryset.order_by('-variants__selling_price').distinct()

        return queryset


class ProductVariantViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVariantSerializer
    permission_classes = [IsProductManagerOrAbove]
    queryset = ProductVariant.objects.all().select_related('product')


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [IsProductManagerOrAbove]
    queryset = ProductImage.objects.all().select_related('product')


class CropsListView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        crop_strings = Product.objects.filter(is_active=True).exclude(
            suitable_crops__isnull=True
        ).exclude(suitable_crops='').values_list('suitable_crops', flat=True)

        crops_set = set()
        for s in crop_strings:
            if s:
                for item in s.split(','):
                    cleaned = item.strip()
                    if cleaned:
                        crops_set.add(cleaned)

        return Response(sorted(list(crops_set)))

