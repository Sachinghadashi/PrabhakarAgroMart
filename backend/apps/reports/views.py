import csv
from datetime import timedelta
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from apps.orders.models import Order
from apps.catalog.models import Product, ProductVariant
from apps.inventory.models import Inventory
from apps.accounts.models import User, AuditLog
from apps.payments.models import Payment
from apps.accounts.serializers import AuditLogSerializer
from apps.accounts.permissions import IsStaffMember


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsStaffMember]

    def get(self, request):
        now = timezone.now()
        range_param = request.query_params.get('range', '7d')

        if range_param == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif range_param == '30d':
            start_date = now - timedelta(days=30)
        elif range_param == '90d':
            start_date = now - timedelta(days=90)
        else: # default 7d
            start_date = now - timedelta(days=7)

        # 1. Revenue metrics: Strictly PAID orders within period
        paid_orders = Order.objects.filter(
            payment_status=Order.PaymentStatus.PAID
        ).exclude(status=Order.Status.CANCELLED)

        period_paid_orders = paid_orders.filter(created_at__gte=start_date)

        total_revenue = paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        period_revenue = period_paid_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        # 2. Orders metrics
        total_orders_count = Order.objects.count()
        period_orders_count = Order.objects.filter(created_at__gte=start_date).count()
        pending_orders_count = Order.objects.filter(
            status__in=[Order.Status.PENDING_PAYMENT, Order.Status.CONFIRMED]
        ).count()
        awaiting_shipment_count = Order.objects.filter(
            status__in=[Order.Status.PROCESSING, Order.Status.PACKED]
        ).count()

        # 3. Customer & Product counts
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_active_products = Product.objects.filter(is_active=True).count()

        # 4. Inventory health
        inventories = Inventory.objects.select_related('variant').all()
        low_stock_count = sum(
            1 for inv in inventories if 0 < inv.available_stock <= inv.variant.low_stock_threshold
        )
        out_of_stock_count = sum(1 for inv in inventories if inv.available_stock <= 0)

        # 5. Payment diagnostics
        payment_failures_count = Payment.objects.filter(status=Payment.Status.FAILED).count()
        cod_pending_amount = Order.objects.filter(
            payment_method=Order.PaymentMethod.COD,
            payment_status=Order.PaymentStatus.PENDING
        ).exclude(status=Order.Status.CANCELLED).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        # 6. Sales trends by day for charts (last N days)
        trend_days = 7 if range_param == '7d' else (30 if range_param == '30d' else 14)
        sales_trend = []
        for i in range(trend_days - 1, -1, -1):
            day = (now - timedelta(days=i)).date()
            day_orders = paid_orders.filter(created_at__date=day)
            day_total = day_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            day_count = day_orders.count()
            sales_trend.append({
                'date': day.strftime('%b %d'),
                'revenue': float(day_total),
                'orders': day_count,
            })

        # 7. Recent 5 orders
        recent_orders = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': o.customer.full_name,
                'status': o.status,
                'payment_status': o.payment_status,
                'total_amount': str(o.total_amount),
                'created_at': o.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for o in Order.objects.select_related('customer').order_by('-created_at')[:5]
        ]

        # 8. Top 5 selling products based on fulfilled order items
        from apps.orders.models import OrderItem
        top_items = OrderItem.objects.filter(
            order__payment_status=Order.PaymentStatus.PAID
        ).values('product_name').annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('total_price')
        ).order_by('-total_qty')[:5]

        top_products = [
            {
                'name': t['product_name'],
                'units_sold': t['total_qty'],
                'revenue': str(t['total_revenue'])
            }
            for t in top_items
        ]

        return Response({
            'total_revenue': str(total_revenue),
            'period_revenue': str(period_revenue),
            'total_orders': total_orders_count,
            'period_orders': period_orders_count,
            'pending_orders': pending_orders_count,
            'awaiting_shipment': awaiting_shipment_count,
            'total_customers': total_customers,
            'total_active_products': total_active_products,
            'low_stock_products': low_stock_count,
            'out_of_stock_products': out_of_stock_count,
            'payment_failures': payment_failures_count,
            'cod_pending_amount': str(cod_pending_amount),
            'sales_trend': sales_trend,
            'recent_orders': recent_orders,
            'top_products': top_products,
            'range': range_param
        }, status=status.HTTP_200_OK)


class SalesReportExportView(APIView):
    permission_classes = [IsStaffMember]

    def get(self, request):
        export_format = request.query_params.get('format', 'json')
        orders = Order.objects.all().select_related('customer').order_by('-created_at')

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="prabhakar_agro_sales_report.csv"'
            writer = csv.writer(response)
            writer.writerow([
                'Order Number', 'Date', 'Customer Name', 'Customer Email',
                'Status', 'Payment Method', 'Payment Status', 'Subtotal (INR)',
                'Discount (INR)', 'Shipping (INR)', 'Tax (INR)', 'Total Amount (INR)'
            ])
            for o in orders:
                writer.writerow([
                    o.order_number, o.created_at.strftime('%Y-%m-%d %H:%M'),
                    o.customer.full_name, o.customer.email, o.status,
                    o.payment_method, o.payment_status, o.subtotal,
                    o.discount_amount, o.shipping_charge, o.tax_amount, o.total_amount
                ])
            return response

        # JSON response
        data = [
            {
                'order_number': o.order_number,
                'created_at': o.created_at.strftime('%Y-%m-%d %H:%M'),
                'customer': o.customer.full_name,
                'status': o.status,
                'payment_method': o.payment_method,
                'payment_status': o.payment_status,
                'total_amount': str(o.total_amount)
            }
            for o in orders[:50]
        ]
        return Response({'sales': data}, status=status.HTTP_200_OK)


class InventoryReportExportView(APIView):
    permission_classes = [IsStaffMember]

    def get(self, request):
        export_format = request.query_params.get('format', 'json')
        variants = ProductVariant.objects.all().select_related('product', 'inventory')

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="prabhakar_agro_inventory_report.csv"'
            writer = csv.writer(response)
            writer.writerow([
                'Product Name', 'SKU', 'Pack Size', 'Selling Price (INR)',
                'Current Stock', 'Reserved Stock', 'Available Stock', 'Status'
            ])
            for v in variants:
                inv = getattr(v, 'inventory', None)
                cur = inv.current_stock if inv else v.stock_quantity
                res = inv.reserved_stock if inv else 0
                avail = cur - res
                stock_status = 'In Stock' if avail > v.low_stock_threshold else ('Low Stock' if avail > 0 else 'Out of Stock')
                writer.writerow([
                    v.product.name, v.sku, f"{v.pack_size} {v.pack_unit}",
                    v.selling_price, cur, res, avail, stock_status
                ])
            return response

        data = [
            {
                'product_name': v.product.name,
                'sku': v.sku,
                'pack_size': f"{v.pack_size} {v.pack_unit}",
                'selling_price': str(v.selling_price),
                'stock_quantity': v.stock_quantity,
                'is_active': v.is_active
            }
            for v in variants
        ]
        return Response({'inventory': data}, status=status.HTTP_200_OK)


class AdminAuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsStaffMember]
    queryset = AuditLog.objects.all().select_related('admin_user')
