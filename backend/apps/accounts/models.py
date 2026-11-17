from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.utils import timezone
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


phone_validator = RegexValidator(
    regex=r'^\+?91?[6-9]\d{9}$',
    message="Phone number must be entered in the format: '+919876543210' or '9876543210'."
)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        PRODUCT_MANAGER = 'PRODUCT_MANAGER', 'Product Manager'
        INVENTORY_MANAGER = 'INVENTORY_MANAGER', 'Inventory Manager'
        ORDER_MANAGER = 'ORDER_MANAGER', 'Order Manager'
        SUPPORT = 'SUPPORT', 'Support Staff'

    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True, validators=[phone_validator])
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=25, choices=Role.choices, default=Role.CUSTOMER, db_index=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def is_admin_user(self):
        return self.role in [
            self.Role.SUPER_ADMIN,
            self.Role.PRODUCT_MANAGER,
            self.Role.INVENTORY_MANAGER,
            self.Role.ORDER_MANAGER,
            self.Role.SUPPORT,
        ]


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    alternate_phone = models.CharField(max_length=15, null=True, blank=True)
    farm_size_acres = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    primary_crops = models.CharField(max_length=255, null=True, blank=True, help_text="e.g. Cotton, Soybean, Wheat, Mango")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.full_name}"


class Address(models.Model):
    class AddressType(models.TextChoices):
        HOME = 'HOME', 'Home'
        FARM = 'FARM', 'Farm / Field'
        WAREHOUSE = 'WAREHOUSE', 'Warehouse'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    recipient_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, validators=[phone_validator])
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    village_town = models.CharField(max_length=150)
    district = models.CharField(max_length=150)
    state = models.CharField(max_length=150, default='Maharashtra')
    pin_code = models.CharField(
        max_length=6,
        validators=[RegexValidator(regex=r'^\d{6}$', message="PIN Code must be a 6-digit number.")]
    )
    delivery_instructions = models.TextField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    address_type = models.CharField(max_length=20, choices=AddressType.choices, default=AddressType.HOME)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Addresses'
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            # Set other addresses of this user to not default
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name}, {self.village_town}, {self.district} - {self.pin_code}"


class AuditLog(models.Model):
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, null=True, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_name = self.admin_user.full_name if self.admin_user else "System"
        return f"{self.timestamp:%Y-%m-%d %H:%M:%S} - {user_name} - {self.action} on {self.model_name}"
