from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckServiceabilityView, ShipmentViewSet

router = DefaultRouter()
router.register('shipments', ShipmentViewSet, basename='shipment')

urlpatterns = [
    path('check-serviceability/', CheckServiceabilityView.as_view(), name='check_serviceability'),
    path('', include(router.urls)),
]
