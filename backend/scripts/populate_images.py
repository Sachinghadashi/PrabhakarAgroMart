import os
import sys
import shutil
import urllib.request
import django

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from apps.catalog.models import Product, ProductImage

MEDIA_PRODUCTS = os.path.join(settings.MEDIA_ROOT, 'products')
os.makedirs(MEDIA_PRODUCTS, exist_ok=True)

# Image sources:
# 1. Mahadhan 19:19:19 NPK
# 2. Bayer Confidor Insecticide
# 3. UPL Saaf Fungicide
# 4. Rasi 659 BG II Cotton Seeds
# 5. Syngenta Fusiflex Herbicide

PRODUCT_ASSETS = [
    {
        'match_key': 'mahadhan',
        'filename': 'mahadhan_191919_npk.jpg',
        'source_file': r'C:\Users\SACHIN GHADASHI\.gemini\antigravity-ide\brain\b37d9a9f-046f-4907-a7f5-a17722e0f94f\mahadhan_npk_fertilizer_1792165396766.jpg',
        'source_url': None,
        'alt': 'Mahadhan 19:19:19 NPK Water Soluble Fertilizer',
    },
    {
        'match_key': 'confidor',
        'filename': 'bayer_confidor_insecticide.jpg',
        'source_file': r'C:\Users\SACHIN GHADASHI\.gemini\antigravity-ide\brain\b37d9a9f-046f-4907-a7f5-a17722e0f94f\bayer_confidor_insecticide_1792165416884.jpg',
        'source_url': None,
        'alt': 'Bayer Confidor Insecticide (Imidacloprid 17.8% SL)',
    },
    {
        'match_key': 'saaf',
        'filename': 'upl_saaf_fungicide.jpg',
        'source_file': r'C:\Users\SACHIN GHADASHI\.gemini\antigravity-ide\brain\b37d9a9f-046f-4907-a7f5-a17722e0f94f\upl_saaf_fungicide_1792165482913.jpg',
        'source_url': None,
        'alt': 'UPL Saaf Fungicide (Carbendazim 12% + Mancozeb 63% WP)',
    },
    {
        'match_key': 'rasi',
        'filename': 'rasi_659_cotton_seeds.jpg',
        'source_file': None,
        'source_url': 'https://www.kisanshop.in/uploads/RASI-659.jpg',
        'alt': 'Rasi 659 BG II Hybrid Cotton Seeds',
    },
    {
        'match_key': 'fusiflex',
        'filename': 'syngenta_fusiflex_herbicide.webp',
        'source_file': None,
        'source_url': 'https://cdn.shopify.com/s/files/1/0722/2059/files/fusiflex-herbicide-file-4957.webp?v=1737471892',
        'alt': 'Syngenta Fusiflex Herbicide (Fomesafen + Fluazifop-p-butyl)',
    },
]

def run():
    print("Starting product image population...")

    # Check Cloudinary credentials
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    has_cloudinary = bool(cloud_name and api_key and api_secret)
    
    if has_cloudinary:
        print(f"Cloudinary credentials detected for cloud: {cloud_name}")
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
    else:
        print("No Cloudinary credentials provided yet. Storing images locally in backend/media/products/ with automatic Cloudinary sync ready.")

    for item in PRODUCT_ASSETS:
        target_path = os.path.join(MEDIA_PRODUCTS, item['filename'])
        
        # 1. Ensure file exists locally
        if item['source_file'] and os.path.exists(item['source_file']):
            shutil.copy2(item['source_file'], target_path)
            print(f"Copied local asset to {target_path}")
        elif item['source_url']:
            if not os.path.exists(target_path):
                print(f"Downloading from {item['source_url']}...")
                req = urllib.request.Request(item['source_url'], headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as resp, open(target_path, 'wb') as out_f:
                    out_f.write(resp.read())
                print(f"Saved to {target_path}")
            else:
                print(f"Asset already exists at {target_path}")

        # 2. Upload to Cloudinary if configured
        cloudinary_url = None
        if has_cloudinary and os.path.exists(target_path):
            try:
                print(f"Uploading {item['filename']} to Cloudinary...")
                upload_res = cloudinary.uploader.upload(
                    target_path,
                    folder="prabhakar_agro_mart/products",
                    public_id=os.path.splitext(item['filename'])[0],
                    overwrite=True,
                    resource_type="image"
                )
                cloudinary_url = upload_res.get('secure_url')
                print(f"Uploaded to Cloudinary: {cloudinary_url}")
            except Exception as e:
                print(f"Cloudinary upload failed for {item['filename']}: {e}")

        # 3. Find matching product in DB
        products = Product.objects.filter(name__icontains=item['match_key'])
        if not products.exists():
            products = Product.objects.filter(slug__icontains=item['match_key'])
            
        for product in products:
            img_rel_path = f"products/{item['filename']}"
            
            # Check if ProductImage already exists
            p_img = product.images.filter(is_primary=True).first()
            if not p_img:
                p_img = product.images.first()

            if not p_img:
                p_img = ProductImage(product=product, is_primary=True, display_order=0)

            p_img.image = img_rel_path
            p_img.alt_text = item['alt']
            if cloudinary_url:
                p_img.external_url = cloudinary_url
            p_img.is_primary = True
            p_img.save()
            print(f"Updated product '{product.name}' with image: {p_img.image_url}")

    print("Product image population finished successfully!")

if __name__ == '__main__':
    run()
