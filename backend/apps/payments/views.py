from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from django.shortcuts import get_object_or_404
from .models import Payment
from .serializers import (
    PaymentSerializer,
    CreateRazorpayOrderSerializer,
    VerifyRazorpayPaymentSerializer,
    ConfirmCODSerializer,
    MarkCODCollectedSerializer,
)
from .services import RazorpayService, CODService
from apps.orders.models import Order
from apps.orders.serializers import OrderDetailSerializer
from apps.accounts.permissions import IsStaffMember


class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateRazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order,
            pk=serializer.validated_data['order_id'],
            customer=request.user
        )

        try:
            checkout_data = RazorpayService.create_order(order)
            return Response(checkout_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyRazorpayPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order,
            pk=serializer.validated_data['order_id'],
            customer=request.user
        )

        try:
            payment = RazorpayService.verify_payment(
                order=order,
                razorpay_order_id=serializer.validated_data['razorpay_order_id'],
                razorpay_payment_id=serializer.validated_data['razorpay_payment_id'],
                razorpay_signature=serializer.validated_data['razorpay_signature']
            )
            return Response({
                'payment': PaymentSerializer(payment).data,
                'order': OrderDetailSerializer(order).data,
                'message': 'Payment successfully verified. Order confirmed!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
        body_bytes = request.body

        try:
            result = RazorpayService.process_webhook(body_bytes, signature)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmCODView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConfirmCODSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(
            Order,
            pk=serializer.validated_data['order_id'],
            customer=request.user
        )

        try:
            confirmed_order = CODService.confirm_cod_order(order)
            return Response({
                'order': OrderDetailSerializer(confirmed_order).data,
                'message': 'Cash on Delivery order confirmed successfully!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MarkCODCollectedView(APIView):
    permission_classes = [IsStaffMember]

    def post(self, request):
        serializer = MarkCODCollectedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(Order, pk=serializer.validated_data['order_id'])

        try:
            payment = CODService.mark_cod_collected(order, request.user)
            return Response({
                'payment': PaymentSerializer(payment).data,
                'order': OrderDetailSerializer(order).data,
                'message': 'COD payment successfully recorded as collected.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Payment.objects.none()
        user = self.request.user
        if user.is_admin_user:
            return Payment.objects.all().select_related('order')
        return Payment.objects.filter(order__customer=user).select_related('order')
