from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, CustomerProfile, Address, AuditLog


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['id', 'avatar', 'alternate_phone', 'farm_size_acres', 'primary_crops']


class UserSerializer(serializers.ModelSerializer):
    profile = CustomerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'full_name', 'role', 'date_joined', 'profile']
        read_only_fields = ['id', 'role', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirmation = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'full_name', 'password', 'password_confirmation']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone'),
            full_name=validated_data['full_name'],
            role=User.Role.CUSTOMER
        )
        CustomerProfile.objects.create(user=user)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'is_staff': self.user.is_staff,
        }
        return data


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'recipient_name', 'phone', 'address_line1', 'address_line2',
            'village_town', 'district', 'state', 'pin_code',
            'delivery_instructions', 'is_default', 'address_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_pin_code(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("PIN code must be exactly 6 digits.")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source='admin_user.full_name', read_only=True)
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'admin_user', 'admin_name', 'admin_email',
            'action', 'model_name', 'object_id', 'changes',
            'ip_address', 'timestamp'
        ]
