from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        ORDER = 'ORDER', 'Order Update'
        PAYMENT = 'PAYMENT', 'Payment Status'
        INVENTORY = 'INVENTORY', 'Inventory Alert'
        PROMOTION = 'PROMOTION', 'Promotion & Offer'
        SYSTEM = 'SYSTEM', 'System Alert'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.ORDER)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.title} (Read: {self.is_read})"
