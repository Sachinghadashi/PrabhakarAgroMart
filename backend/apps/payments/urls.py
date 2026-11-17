from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
    RazorpayWebhookView,
    ConfirmCODView,
    MarkCODCollectedView,
    PaymentViewSet,
)

router = DefaultRouter()
router.register('history', PaymentViewSet, basename='payment_history')

urlpatterns = [
    path('razorpay/create-order/', CreateRazorpayOrderView.as_view(), name='razorpay_create_order'),
    path('razorpay/verify/', VerifyRazorpayPaymentView.as_view(), name='razorpay_verify'),
    path('razorpay/webhook/', RazorpayWebhookView.as_view(), name='razorpay_webhook'),
    path('cod/confirm/', ConfirmCODView.as_view(), name='cod_confirm'),
    path('cod/mark-collected/', MarkCODCollectedView.as_view(), name='cod_mark_collected'),
    path('', include(router.urls)),
]
