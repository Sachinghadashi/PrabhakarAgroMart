from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, CustomerProfile, Address
from apps.catalog.models import Category, Brand, Product, ProductVariant
from apps.inventory.models import Inventory, InventoryTransaction
from apps.promotions.models import Coupon


class Command(BaseCommand):
    help = 'Seeds initial agricultural categories, brands, products, inventory, coupons, and test accounts'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Prabhakar Agro Mart initial dataset...")

        # 1. Categories
        categories_data = [
            {'name': 'Fertilizers', 'slug': 'fertilizers', 'description': 'Soil nutrients, water-soluble fertilizers, and bio-stimulants for healthy crop yields.', 'display_order': 1},
            {'name': 'Seeds', 'slug': 'seeds', 'description': 'Certified hybrid and high-yielding seeds for cash crops, cereals, and vegetables.', 'display_order': 2},
            {'name': 'Fungicides', 'slug': 'fungicides', 'description': 'Systemic and contact fungicides protecting crops against blights, rusts, and powdery mildews.', 'display_order': 3},
            {'name': 'Insecticides', 'slug': 'insecticides', 'description': 'Targeted pest control solutions protecting against bollworms, aphids, thrips, and mites.', 'display_order': 4},
            {'name': 'Herbicides', 'slug': 'herbicides', 'description': 'Pre-emergence and post-emergence weed solutions for maximum field productivity.', 'display_order': 5},
        ]

        cat_objs = {}
        for c in categories_data:
            obj, _ = Category.objects.get_or_create(
                slug=c['slug'],
                defaults={'name': c['name'], 'description': c['description'], 'display_order': c['display_order']}
            )
            cat_objs[c['slug']] = obj
        self.stdout.write(f"[OK] Seeded {len(cat_objs)} agricultural categories")

        # 2. Brands
        brands_data = [
            {'name': 'Mahadhan Agro', 'slug': 'mahadhan', 'description': 'Leading provider of specialty fertilizers and plant nutrition across India.'},
            {'name': 'Bayer CropScience', 'slug': 'bayer', 'description': 'Global innovator in modern crop protection and sustainable agriculture.'},
            {'name': 'UPL Limited', 'slug': 'upl', 'description': 'Pioneering open-agriculture solutions, biosolutions, and crop protection.'},
            {'name': 'Syngenta India', 'slug': 'syngenta', 'description': 'High-performing seeds and research-backed crop chemicals for Indian farmers.'},
            {'name': 'Rasi Seeds', 'slug': 'rasi-seeds', 'description': 'Leader in high-yield hybrid cotton, paddy, and millet seeds.'},
        ]

        brand_objs = {}
        for b in brands_data:
            obj, _ = Brand.objects.get_or_create(
                slug=b['slug'],
                defaults={'name': b['name'], 'description': b['description']}
            )
            brand_objs[b['slug']] = obj
        self.stdout.write(f"[OK] Seeded {len(brand_objs)} agricultural brands")

        # 3. Products & Variants with Inventory
        products_data = [
            {
                'name': 'Mahadhan 19:19:19 NPK Water Soluble Fertilizer',
                'slug': 'mahadhan-19-19-19-npk',
                'brand': brand_objs['mahadhan'],
                'category': cat_objs['fertilizers'],
                'sku': 'MD-NPK-191919',
                'description': 'Balanced 100% water-soluble fertilizer containing Nitrogen, Phosphorus, and Potassium in equal proportions. Ideal for foliar spray and fertigation during early vegetative stages.',
                'specifications': {
                    'Total Nitrogen (N)': '19.0% min',
                    'Water Soluble Phosphate (P2O5)': '19.0% min',
                    'Water Soluble Potash (K2O)': '19.0% min',
                    'Moisture': '0.5% max',
                    'Physical State': 'Crystalline White Powder'
                },
                'usage_instructions': 'Dissolve 5 grams per liter of water for foliar spray. For drip irrigation, apply 2-3 kg per acre every 7-10 days during vegetative growth.',
                'safety_info': 'Store in a dry, shaded place away from direct sunlight and children. Wash hands thoroughly with soap after handling.',
                'suitable_crops': 'Cotton, Sugarcane, Chilli, Tomato, Grapes, Pomegranate, Wheat, Onion',
                'product_type': Product.ProductType.CHEMICAL,
                'is_featured': True,
                'is_bestseller': True,
                'variants': [
                    {'size': Decimal('1.00'), 'unit': ProductVariant.Unit.KG, 'sku': 'MD-NPK19-1KG', 'orig': Decimal('220.00'), 'sell': Decimal('185.00'), 'stock': 120},
                    {'size': Decimal('5.00'), 'unit': ProductVariant.Unit.KG, 'sku': 'MD-NPK19-5KG', 'orig': Decimal('980.00'), 'sell': Decimal('840.00'), 'stock': 45},
                    {'size': Decimal('25.00'), 'unit': ProductVariant.Unit.KG, 'sku': 'MD-NPK19-25KG', 'orig': Decimal('4200.00'), 'sell': Decimal('3650.00'), 'stock': 15},
                ]
            },
            {
                'name': 'Bayer Confidor Insecticide (Imidacloprid 17.8% SL)',
                'slug': 'bayer-confidor-insecticide',
                'brand': brand_objs['bayer'],
                'category': cat_objs['insecticides'],
                'sku': 'BY-CONF-178',
                'description': 'World-renowned systemic insecticide with translaminar activity. Provides long-lasting protection against sucking pests like aphids, jassids, and thrips.',
                'specifications': {
                    'Active Ingredient': 'Imidacloprid 17.8% w/w SL',
                    'Formulation': 'Soluble Liquid (SL)',
                    'Mode of Action': 'Systemic with Contact and Stomach action',
                    'Target Pests': 'Aphids, Whiteflies, Jassids, Thrips'
                },
                'usage_instructions': 'Mix 0.5 ml to 1 ml per liter of clean water. Spray uniformly covering both upper and lower surface of foliage when pest infestation appears.',
                'safety_info': 'Class II moderately hazardous. Always wear protective gloves, mask, and goggles during preparation and spraying. Do not spray against the wind direction.',
                'suitable_crops': 'Cotton, Paddy, Chilli, Okra, Tomato, Mango, Sugarcane',
                'product_type': Product.ProductType.CHEMICAL,
                'is_featured': True,
                'is_bestseller': True,
                'variants': [
                    {'size': Decimal('100.00'), 'unit': ProductVariant.Unit.ML, 'sku': 'BY-CONF-100ML', 'orig': Decimal('340.00'), 'sell': Decimal('295.00'), 'stock': 90},
                    {'size': Decimal('250.00'), 'unit': ProductVariant.Unit.ML, 'sku': 'BY-CONF-250ML', 'orig': Decimal('750.00'), 'sell': Decimal('660.00'), 'stock': 50},
                    {'size': Decimal('500.00'), 'unit': ProductVariant.Unit.ML, 'sku': 'BY-CONF-500ML', 'orig': Decimal('1420.00'), 'sell': Decimal('1250.00'), 'stock': 28},
                ]
            },
            {
                'name': 'UPL Saaf Fungicide (Carbendazim 12% + Mancozeb 63% WP)',
                'slug': 'upl-saaf-fungicide',
                'brand': brand_objs['upl'],
                'category': cat_objs['fungicides'],
                'sku': 'UPL-SAAF-75WP',
                'description': 'Proven dual-action contact and systemic fungicide. Delivers superior control of fungal pathogens affecting root zones, stems, and leaves.',
                'specifications': {
                    'Active Ingredients': 'Carbendazim 12% + Mancozeb 63% WP',
                    'Compatibility': 'Compatible with commonly used insecticides and foliar nutrients',
                    'Formulation': 'Wettable Powder'
                },
                'usage_instructions': 'For foliar application, dissolve 2 grams per liter of water. For seed treatment, mix 2.5 grams per kg of seed before sowing.',
                'safety_info': 'Do not inhale dust or spray mist. Avoid contact with skin and eyes. Keep away from water bodies and animal fodder.',
                'suitable_crops': 'Paddy, Groundnut, Potato, Tea, Grapes, Mango, Chilli',
                'product_type': Product.ProductType.CHEMICAL,
                'is_featured': True,
                'is_bestseller': False,
                'variants': [
                    {'size': Decimal('250.00'), 'unit': ProductVariant.Unit.GM, 'sku': 'UPL-SAAF-250G', 'orig': Decimal('260.00'), 'sell': Decimal('225.00'), 'stock': 75},
                    {'size': Decimal('500.00'), 'unit': ProductVariant.Unit.GM, 'sku': 'UPL-SAAF-500G', 'orig': Decimal('480.00'), 'sell': Decimal('415.00'), 'stock': 40},
                    {'size': Decimal('1.00'), 'unit': ProductVariant.Unit.KG, 'sku': 'UPL-SAAF-1KG', 'orig': Decimal('890.00'), 'sell': Decimal('780.00'), 'stock': 30},
                ]
            },
            {
                'name': 'Rasi 659 BG II Hybrid Cotton Seeds',
                'slug': 'rasi-659-bg-ii-cotton-seeds',
                'brand': brand_objs['rasi-seeds'],
                'category': cat_objs['seeds'],
                'sku': 'RASI-659-BG2',
                'description': 'Top performing Bollgard II hybrid cotton seed. Highly tolerant to sucking pests and leaf reddening, producing big bolls and high ginning outturn.',
                'specifications': {
                    'Maturity': '150 - 160 days',
                    'Boll Weight': '5.0 - 5.5 grams',
                    'Staple Length': '29 - 30 mm',
                    'Spacing Recommended': '90 x 60 cm or 120 x 45 cm'
                },
                'usage_instructions': 'Sow at depth of 2-3 cm with adequate soil moisture. Ensure one seed per hill with refugia seeds planted around the perimeter as per agronomic guidelines.',
                'safety_info': 'Certified genetically modified seed containing Cry1Ac and Cry2Ab proteins. For agricultural planting purpose only, not for food or oil extraction.',
                'suitable_crops': 'Cotton',
                'product_type': Product.ProductType.HYBRID,
                'is_featured': True,
                'is_bestseller': True,
                'variants': [
                    {'size': Decimal('475.00'), 'unit': ProductVariant.Unit.GM, 'sku': 'RASI-659-PKT', 'orig': Decimal('920.00'), 'sell': Decimal('864.00'), 'stock': 160},
                ]
            },
            {
                'name': 'Syngenta Fusiflex Herbicide',
                'slug': 'syngenta-fusiflex-herbicide',
                'brand': brand_objs['syngenta'],
                'category': cat_objs['herbicides'],
                'sku': 'SYN-FUSI-FLEX',
                'description': 'Selective early post-emergence herbicide providing unmatched control over both grassy and broad-leaved weeds in soybean fields.',
                'specifications': {
                    'Formulation': 'Emulsifiable Concentrate',
                    'Application Window': '15-20 days after crop emergence (2-4 weed leaf stage)',
                    'Action': 'Rapid absorption through weed leaves and roots'
                },
                'usage_instructions': 'Apply 400 ml per acre mixed in 150-200 liters of water using a flat fan nozzle. Ensure adequate soil moisture at application time.',
                'safety_info': 'Flammable liquid. Keep away from heat, sparks, and open flame. Do not contaminate irrigation canals, ponds, or natural streams.',
                'suitable_crops': 'Soybean, Groundnut',
                'product_type': Product.ProductType.CHEMICAL,
                'is_featured': False,
                'is_bestseller': False,
                'variants': [
                    {'size': Decimal('400.00'), 'unit': ProductVariant.Unit.ML, 'sku': 'SYN-FUSI-400ML', 'orig': Decimal('850.00'), 'sell': Decimal('740.00'), 'stock': 35},
                    {'size': Decimal('800.00'), 'unit': ProductVariant.Unit.ML, 'sku': 'SYN-FUSI-800ML', 'orig': Decimal('1620.00'), 'sell': Decimal('1420.00'), 'stock': 18},
                ]
            }
        ]

        for p_data in products_data:
            variants_info = p_data.pop('variants')
            product, _ = Product.objects.get_or_create(
                slug=p_data['slug'],
                defaults=p_data
            )

            for v_info in variants_info:
                variant, _ = ProductVariant.objects.get_or_create(
                    product=product,
                    pack_size=v_info['size'],
                    pack_unit=v_info['unit'],
                    defaults={
                        'sku': v_info['sku'],
                        'original_price': v_info['orig'],
                        'selling_price': v_info['sell'],
                        'stock_quantity': v_info['stock'],
                        'is_active': True
                    }
                )
                # Initialize inventory record
                inv, _ = Inventory.objects.get_or_create(
                    variant=variant,
                    defaults={'current_stock': v_info['stock'], 'reserved_stock': 0}
                )
                if not InventoryTransaction.objects.filter(variant=variant).exists():
                    InventoryTransaction.objects.create(
                        variant=variant,
                        transaction_type=InventoryTransaction.TransactionType.STOCK_IN,
                        quantity=v_info['stock'],
                        reason="Initial System Warehouse Seeding"
                    )

        self.stdout.write(f"[OK] Seeded {len(products_data)} agricultural products with variants & stock")

        # 4. Coupons
        coupons = [
            {
                'code': 'KISAN10',
                'description': '10% Discount on orders above Rs. 1000 for verified farmers',
                'discount_type': Coupon.DiscountType.PERCENTAGE,
                'discount_value': Decimal('10.00'),
                'min_order_value': Decimal('1000.00'),
                'max_discount': Decimal('500.00'),
                'end_date': timezone.now() + timezone.timedelta(days=90)
            },
            {
                'code': 'HARVEST20',
                'description': 'Rs. 200 Flat Instant Discount on bulk agricultural orders above Rs. 2500',
                'discount_type': Coupon.DiscountType.FIXED,
                'discount_value': Decimal('200.00'),
                'min_order_value': Decimal('2500.00'),
                'max_discount': Decimal('200.00'),
                'end_date': timezone.now() + timezone.timedelta(days=60)
            },
            {
                'code': 'WELCOME50',
                'description': 'Welcome Rs. 50 off on your first agro order',
                'discount_type': Coupon.DiscountType.FIXED,
                'discount_value': Decimal('50.00'),
                'min_order_value': Decimal('500.00'),
                'max_discount': Decimal('50.00'),
                'end_date': timezone.now() + timezone.timedelta(days=120)
            }
        ]

        for coup in coupons:
            Coupon.objects.get_or_create(code=coup['code'], defaults=coup)
        self.stdout.write(f"[OK] Seeded {len(coupons)} operational promotional coupons")

        # 5. Default Test Customer & Delivery Address
        customer_email = 'kisan@prabhakar.com'
        if not User.objects.filter(email=customer_email).exists():
            farmer = User.objects.create_user(
                email=customer_email,
                password='Kisan@12345',
                full_name='Rameshwar Patil',
                phone='+919876500001',
                role=User.Role.CUSTOMER
            )
            CustomerProfile.objects.create(
                user=farmer,
                alternate_phone='+919876500002',
                farm_size_acres=Decimal('12.50'),
                primary_crops='Cotton, Soybean, Sugarcane'
            )
            Address.objects.create(
                user=farmer,
                recipient_name='Rameshwar Patil',
                phone='+919876500001',
                address_line1='Gat No. 142, Near Datta Temple',
                address_line2='Post Khed, Taluka North Solapur',
                village_town='Khed',
                district='Solapur',
                state='Maharashtra',
                pin_code='413002',
                is_default=True,
                address_type=Address.AddressType.FARM
            )
            self.stdout.write(f"[OK] Created sample customer '{customer_email}' with farm profile & address")

        self.stdout.write(self.style.SUCCESS("[OK] All seed data initialized successfully!"))
