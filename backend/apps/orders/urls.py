from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckoutView, CustomerOrderViewSet, AdminOrderViewSet

router = DefaultRouter()
router.register('history', CustomerOrderViewSet, basename='order_history')
router.register('admin-orders', AdminOrderViewSet, basename='admin_orders')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='order_checkout'),
    path('', include(router.urls)),
]
