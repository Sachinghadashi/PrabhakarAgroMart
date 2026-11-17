from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryViewSet,
    InventoryAdjustmentView,
    InventoryTransactionListView,
)

router = DefaultRouter()
router.register('', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('adjust/', InventoryAdjustmentView.as_view(), name='inventory_adjust'),
    path('transactions/', InventoryTransactionListView.as_view(), name='inventory_transactions'),
    path('', include(router.urls)),
]
