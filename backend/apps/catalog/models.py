from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.parent.name} -> {self.name}" if self.parent else self.name


class Brand(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    class ProductType(models.TextChoices):
        ORGANIC = 'ORGANIC', 'Organic'
        CHEMICAL = 'CHEMICAL', 'Chemical / Standard'
        BIO = 'BIO', 'Bio-Fertilizer / Bio-Pesticide'
        HYBRID = 'HYBRID', 'Hybrid Seed'

    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=270, unique=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    sku = models.CharField(max_length=60, unique=True, db_index=True)
    barcode = models.CharField(max_length=60, null=True, blank=True)
    description = models.TextField()
    specifications = models.JSONField(default=dict, blank=True, help_text="Key-value pairs of technical specs")
    usage_instructions = models.TextField(blank=True, null=True)
    safety_info = models.TextField(blank=True, null=True, help_text="Agricultural chemical safety, precautions, antidotes")
    suitable_crops = models.CharField(max_length=255, blank=True, null=True, help_text="e.g. Cotton, Paddy, Chilli, Tomato, Sugarcane")
    product_type = models.CharField(max_length=20, choices=ProductType.choices, default=ProductType.CHEMICAL)

    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    is_bestseller = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.brand.name})"

    @property
    def primary_image_url(self):
        first_img = self.images.filter(is_primary=True).first() or self.images.first()
        return first_img.image_url if first_img else None

    @property
    def starting_price(self):
        variant = self.variants.filter(is_active=True).order_by('selling_price').first()
        return variant.selling_price if variant else None


class ProductVariant(models.Model):
    class Unit(models.TextChoices):
        KG = 'KG', 'Kilogram (Kg)'
        GM = 'GM', 'Gram (g)'
        LTR = 'LTR', 'Litre (L)'
        ML = 'ML', 'Millilitre (ml)'
        PACK = 'PACK', 'Packet'
        PIECE = 'PIECE', 'Piece'

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    pack_size = models.DecimalField(max_digits=8, decimal_places=2, help_text="Numeric quantity e.g. 1.00, 500, 5.00")
    pack_unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    sku = models.CharField(max_length=70, unique=True, db_index=True)
    barcode = models.CharField(max_length=70, null=True, blank=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="MRP in INR")
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Discounted / Selling price in INR")
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['selling_price']
        unique_together = ('product', 'pack_size', 'pack_unit')

    def __str__(self):
        return f"{self.product.name} - {self.pack_size} {self.pack_unit} (₹{self.selling_price})"

    @property
    def discount_percent(self):
        if self.original_price and self.original_price > self.selling_price:
            diff = self.original_price - self.selling_price
            return int((diff / self.original_price) * 100)
        return 0

    @property
    def in_stock(self):
        return self.stock_quantity > 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    external_url = models.URLField(max_length=500, blank=True, null=True, help_text="Cloudinary or CDN image URL")
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'id']

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    @property
    def image_url(self):
        if self.external_url:
            return self.external_url
        if self.image:
            return self.image.url
        return None

    def __str__(self):
        return f"Image of {self.product.name} (Primary: {self.is_primary})"
