import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.catalog.models import ProductImage

class Command(BaseCommand):
    help = 'Uploads local product images to Cloudinary and updates product records with Cloudinary URLs'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Force re-upload of already uploaded images')

    def handle(self, *args, **options):
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        api_key = os.getenv('CLOUDINARY_API_KEY')
        api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        if not (cloud_name and api_key and api_secret):
            self.stderr.write(self.style.ERROR(
                "ERROR: Cloudinary credentials not configured!\n"
                "Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
            ))
            return

        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )

        self.stdout.write(self.style.SUCCESS(f"Connected to Cloudinary account: {cloud_name}"))

        images = ProductImage.objects.all()
        count = images.count()
        self.stdout.write(f"Found {count} ProductImage records.")

        uploaded_count = 0
        for p_img in images:
            # If already has cloudinary URL and not forcing, skip
            if p_img.external_url and 'res.cloudinary.com' in p_img.external_url and not options['force']:
                self.stdout.write(f"Skipping {p_img.product.name} (already on Cloudinary: {p_img.external_url})")
                continue

            local_file_path = None
            if p_img.image:
                local_file_path = os.path.join(settings.MEDIA_ROOT, str(p_img.image).replace('media/', '').replace('media\\', ''))
                if not os.path.exists(local_file_path):
                    local_file_path = os.path.join(settings.BASE_DIR, str(p_img.image))

            if not local_file_path or not os.path.exists(local_file_path):
                self.stderr.write(self.style.WARNING(f"Could not find local file for image id {p_img.id} ({p_img.product.name})"))
                continue

            try:
                clean_name = os.path.splitext(os.path.basename(local_file_path))[0]
                self.stdout.write(f"Uploading {local_file_path} for product '{p_img.product.name}'...")
                res = cloudinary.uploader.upload(
                    local_file_path,
                    folder="prabhakar_agro_mart/products",
                    public_id=f"prod_{p_img.product.id}_{clean_name}",
                    overwrite=True,
                    resource_type="image"
                )
                secure_url = res.get('secure_url')
                p_img.external_url = secure_url
                p_img.save()
                uploaded_count += 1
                self.stdout.write(self.style.SUCCESS(f"  [OK] Uploaded to Cloudinary: {secure_url}"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  [FAIL] Upload failed: {e}"))

        self.stdout.write(self.style.SUCCESS(f"\nCompleted! Successfully synced {uploaded_count} images to Cloudinary."))
