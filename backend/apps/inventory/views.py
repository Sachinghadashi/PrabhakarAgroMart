from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Inventory, InventoryTransaction
from .serializers import (
    InventorySerializer,
    InventoryAdjustmentSerializer,
    InventoryTransactionSerializer,
)
from .services import InventoryService
from apps.catalog.models import ProductVariant
from apps.accounts.permissions import IsInventoryManagerOrAbove
from apps.accounts.models import AuditLog


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventorySerializer
    permission_classes = [IsInventoryManagerOrAbove]

    def get_queryset(self):
        queryset = Inventory.objects.all().select_related('variant', 'variant__product')
        status_filter = self.request.query_params.get('status')
        if status_filter == 'low_stock':
            # Low stock where available <= threshold and available > 0
            queryset = [inv for inv in queryset if 0 < inv.available_stock <= inv.variant.low_stock_threshold]
            return queryset
        elif status_filter == 'out_of_stock':
            queryset = [inv for inv in queryset if inv.available_stock <= 0]
            return queryset
        return queryset


class InventoryAdjustmentView(APIView):
    permission_classes = [IsInventoryManagerOrAbove]

    def post(self, request):
        serializer = InventoryAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant = get_object_or_404(ProductVariant, pk=serializer.validated_data['variant_id'])
        qty_diff = serializer.validated_data['quantity_diff']
        reason = serializer.validated_data['reason']

        try:
            inv = InventoryService.manual_adjustment(
                variant=variant,
                quantity_diff=qty_diff,
                reason=reason,
                user=request.user
            )

            # Record in AuditLog
            AuditLog.objects.create(
                admin_user=request.user,
                action='INVENTORY_ADJUSTMENT',
                model_name='Inventory',
                object_id=str(inv.id),
                changes={
                    'variant_sku': variant.sku,
                    'quantity_diff': qty_diff,
                    'reason': reason,
                    'new_stock': inv.current_stock
                },
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response(InventorySerializer(inv).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InventoryTransactionListView(generics.ListAPIView):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsInventoryManagerOrAbove]

    def get_queryset(self):
        queryset = InventoryTransaction.objects.all().select_related('variant', 'variant__product', 'performed_by')
        variant_id = self.request.query_params.get('variant_id')
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)
        return queryset
