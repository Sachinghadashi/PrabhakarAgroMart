from django.urls import path
from .views import (
    AdminDashboardSummaryView,
    SalesReportExportView,
    InventoryReportExportView,
    AdminAuditLogListView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardSummaryView.as_view(), name='admin_dashboard_summary'),
    path('reports/sales/', SalesReportExportView.as_view(), name='admin_report_sales'),
    path('reports/inventory/', InventoryReportExportView.as_view(), name='admin_report_inventory'),
    path('audit-logs/', AdminAuditLogListView.as_view(), name='admin_audit_logs'),
]
