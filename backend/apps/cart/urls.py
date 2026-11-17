from django.urls import path
from .views import (
    CartView,
    CartItemAddView,
    CartItemDetailView,
    CartApplyCouponView,
    CartRemoveCouponView,
)

urlpatterns = [
    path('', CartView.as_view(), name='cart_detail'),
    path('items/', CartItemAddView.as_view(), name='cart_item_add'),
    path('items/<int:item_id>/', CartItemDetailView.as_view(), name='cart_item_detail'),
    path('apply-coupon/', CartApplyCouponView.as_view(), name='cart_apply_coupon'),
    path('remove-coupon/', CartRemoveCouponView.as_view(), name='cart_remove_coupon'),
]
