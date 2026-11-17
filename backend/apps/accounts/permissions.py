from rest_framework import permissions


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER')


class IsStaffMember(permissions.BasePermission):
    """Allows access to any administrative role (Super Admin, Product/Inventory/Order Manager, Support)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_user)


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SUPER_ADMIN')


class IsProductManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['SUPER_ADMIN', 'PRODUCT_MANAGER']
        )


class IsInventoryManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['SUPER_ADMIN', 'INVENTORY_MANAGER']
        )


class IsOrderManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['SUPER_ADMIN', 'ORDER_MANAGER', 'SUPPORT']
        )
