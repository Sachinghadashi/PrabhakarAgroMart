from rest_framework import viewsets, permissions
from .models import Coupon
from .serializers import CouponSerializer
from apps.accounts.permissions import IsStaffMember


class CouponViewSet(viewsets.ModelViewSet):
    serializer_class = CouponSerializer
    lookup_field = 'code'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Customers can see active public coupons
            return [permissions.AllowAny()]
        return [IsStaffMember()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_user:
            return Coupon.objects.all()
        return Coupon.objects.filter(is_active=True)
