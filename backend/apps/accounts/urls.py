from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    AdminTokenObtainPairView,
    CurrentUserView,
    CustomerProfileUpdateView,
    AddressViewSet,
    PasswordResetRequestView,
)

router = DefaultRouter()
router.register('addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('admin-login/', AdminTokenObtainPairView.as_view(), name='admin_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('profile/', CustomerProfileUpdateView.as_view(), name='auth_profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset'),
    path('', include(router.urls)),
]
