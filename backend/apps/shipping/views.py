from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from .models import Shipment
from .serializers import ShipmentSerializer, ServiceabilityCheckSerializer
from apps.accounts.permissions import IsOrderManagerOrAbove


class CheckServiceabilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        pincode = request.query_params.get('pincode', '').strip()
        serializer = ServiceabilityCheckSerializer(data={'pincode': pincode})
        serializer.is_valid(raise_exception=True)

        pin = serializer.validated_data['pincode']

        # Configurable serviceability logic:
        # First digit 1-8 represents valid postal zones of India
        first_digit = int(pin[0])
        is_serviceable = first_digit in [1, 2, 3, 4, 5, 6, 7, 8]

        # Maharashtra (40-44) receives express delivery
        zone = "West Zone"
        estimated_days = "3 - 5 business days"
        if pin.startswith(('41', '42', '43', '44', '40')):
            zone = "Maharashtra Core Hub"
            estimated_days = "2 - 3 business days"

        return Response({
            'pincode': pin,
            'is_serviceable': is_serviceable,
            'zone': zone,
            'estimated_delivery_time': estimated_days,
            'cod_available': is_serviceable,
            'free_shipping_eligible': True,
            'carrier': 'Kisan Logistics / Express Delivery Network'
        }, status=status.HTTP_200_OK)


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsOrderManagerOrAbove]
    queryset = Shipment.objects.all().select_related('order')
