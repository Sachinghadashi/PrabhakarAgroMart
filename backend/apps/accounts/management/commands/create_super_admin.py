from django.core.management.base import BaseCommand
from apps.accounts.models import User, CustomerProfile


class Command(BaseCommand):
    help = 'Create an initial Super Admin user with full operational privileges'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email address')
        parser.add_argument('--password', type=str, help='Admin password')
        parser.add_argument('--name', type=str, default='Prabhakar Admin', help='Full name')
        parser.add_argument('--phone', type=str, default='+919876543210', help='Phone number')

    def handle(self, *args, **options):
        email = options.get('email')
        password = options.get('password')
        name = options.get('name')
        phone = options.get('phone')

        if not email:
            email = input('Enter Super Admin Email: ').strip()
        if not password:
            import getpass
            password = getpass.getpass('Enter Super Admin Password: ').strip()

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User with email '{email}' already exists."))
            user = User.objects.get(email=email)
            user.role = User.Role.SUPER_ADMIN
            user.is_staff = True
            user.is_superuser = True
            if password:
                user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"User '{email}' upgraded to Super Admin successfully."))
            return

        user = User.objects.create_superuser(
            email=email,
            password=password,
            full_name=name,
            phone=phone,
            role=User.Role.SUPER_ADMIN
        )
        CustomerProfile.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS(f"Super Admin '{email}' created successfully!"))
