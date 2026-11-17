from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .services import CartService
from .serializers import AddToCartSerializer, UpdateCartItemSerializer, ApplyCouponSerializer
from apps.catalog.models import ProductVariant


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = CartService.get_or_create_cart(request.user)
        summary = CartService.calculate_cart_summary(cart)
        return Response(summary, status=status.HTTP_200_OK)

    def delete(self, request):
        cart = CartService.get_or_create_cart(request.user)
        CartService.clear_cart(cart)
        summary = CartService.calculate_cart_summary(cart)
        return Response(summary, status=status.HTTP_200_OK)


class CartItemAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant = get_object_or_404(ProductVariant, pk=serializer.validated_data['variant_id'])
        quantity = serializer.validated_data['quantity']
        cart = CartService.get_or_create_cart(request.user)

        try:
            CartService.add_to_cart(cart, variant, quantity)
            summary = CartService.calculate_cart_summary(cart)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request.user)
        quantity = serializer.validated_data['quantity']

        try:
            CartService.update_quantity(cart, item_id, quantity)
            summary = CartService.calculate_cart_summary(cart)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, item_id):
        cart = CartService.get_or_create_cart(request.user)
        CartService.remove_item(cart, item_id)
        summary = CartService.calculate_cart_summary(cart)
        return Response(summary, status=status.HTTP_200_OK)


class CartApplyCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request.user)
        try:
            coupon = CartService.apply_coupon(cart, serializer.validated_data['code'])
            summary = CartService.calculate_cart_summary(cart)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CartRemoveCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = CartService.get_or_create_cart(request.user)
        CartService.remove_coupon(cart)
        summary = CartService.calculate_cart_summary(cart)
        return Response(summary, status=status.HTTP_200_OK)
