from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    BrandViewSet,
    ProductViewSet,
    ProductVariantViewSet,
    ProductImageViewSet,
    CropsListView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('brands', BrandViewSet, basename='brand')
router.register('crops', CropsListView, basename='crop')
router.register('products', ProductViewSet, basename='product')
router.register('variants', ProductVariantViewSet, basename='variant')
router.register('images', ProductImageViewSet, basename='product-image')

urlpatterns = [
    path('', include(router.urls)),
]
