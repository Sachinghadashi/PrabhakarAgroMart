from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .services import OrderService
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    CheckoutInputSerializer,
    OrderStatusTransitionSerializer,
    CancelOrderSerializer,
)
from apps.accounts.permissions import IsOrderManagerOrAbove


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = OrderService.create_order_from_cart(
                user=request.user,
                address_id=serializer.validated_data['address_id'],
                payment_method=serializer.validated_data.get('payment_method', Order.PaymentMethod.RAZORPAY),
                notes=serializer.validated_data.get('notes')
            )
            return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'payment_method']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Order.objects.none()
        return Order.objects.filter(customer=self.request.user).prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason')

        try:
            cancelled_order = OrderService.cancel_order(order, request.user, reason)
            return Response(OrderDetailSerializer(cancelled_order).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        order = self.get_object()
        return Response({
            'invoice_number': f"INV-{order.order_number}",
            'order_number': order.order_number,
            'date': order.created_at.strftime('%d %B %Y, %I:%M %p'),
            'company': {
                'name': 'Prabhakar Agro Mart',
                'tagline': 'Your Trusted Partner in Agriculture',
                'gstin': '27AAAAA0000A1Z5',
                'address': 'Agro Trade Hub, Station Road, Solapur, Maharashtra 413001',
                'support_email': 'support@prabhakaragromart.com',
                'support_phone': '+91 98765 43210'
            },
            'customer': {
                'name': order.customer.full_name,
                'email': order.customer.email,
                'phone': order.customer.phone
            },
            'shipping_address': order.shipping_address,
            'payment': {
                'method': order.get_payment_method_display(),
                'status': order.get_payment_status_display()
            },
            'items': [
                {
                    'product_name': i.product_name,
                    'sku': i.sku,
                    'pack_size': i.pack_size,
                    'quantity': i.quantity,
                    'unit_price': str(i.unit_price),
                    'total_price': str(i.total_price)
                }
                for i in order.items.all()
            ],
            'financials': {
                'subtotal': str(order.subtotal),
                'discount_amount': str(order.discount_amount),
                'shipping_charge': str(order.shipping_charge),
                'tax_amount': str(order.tax_amount),
                'total_amount': str(order.total_amount)
            }
        })


class AdminOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrderManagerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'payment_method']
    search_fields = ['order_number', 'customer__full_name', 'customer__email', 'customer__phone', 'tracking_number']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        return Order.objects.all().select_related('customer').prefetch_related('items')

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return OrderDetailSerializer
        return OrderListSerializer

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = serializer.validated_data['target_status']
        tracking = serializer.validated_data.get('tracking_number')
        courier = serializer.validated_data.get('courier_name')

        try:
            updated_order = OrderService.transition_status(
                order=order,
                target_status=target_status,
                admin_user=request.user,
                tracking_number=tracking,
                courier_name=courier
            )
            return Response(OrderDetailSerializer(updated_order).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
