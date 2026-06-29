from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


hex_color_validator = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="Primary color must be a valid hex color like #0F172A.",
)


def generate_unique_slug(instance, value, slug_field_name="slug"):
    base_slug = slugify(value) or "item"
    model_class = instance.__class__
    slug = base_slug
    counter = 1

    while model_class.objects.filter(**{slug_field_name: slug}).exclude(pk=instance.pk).exists():
        counter += 1
        slug = f"{base_slug}-{counter}"

    return slug


class Category(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=180, unique=True, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        self.name = self.name.strip()
        super().save(*args, **kwargs)


class Store(models.Model):
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to="store/logo/", blank=True, null=True)
    primary_color = models.CharField(max_length=7, validators=[hex_color_validator], default="#0F172A")
    phone_number = models.CharField(max_length=30)
    address = models.TextField()
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Store"
        verbose_name_plural = "Store"

    def __str__(self):
        return self.name

    def clean(self):
        if Store.objects.exclude(pk=self.pk).exists():
            raise ValidationError("Only one store configuration is allowed.")
        self.name = self.name.strip()
        self.phone_number = self.phone_number.strip()
        self.address = self.address.strip()
        self.description = self.description.strip()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class AccountRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    CUSTOMER = "customer", "Customer"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=AccountRole.choices, default=AccountRole.CUSTOMER)
    phone = models.CharField(max_length=30, blank=True)

    class Meta:
        ordering = ["full_name", "user__username"]

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"

    def save(self, *args, **kwargs):
        self.full_name = self.full_name.strip()
        self.phone = self.phone.strip()
        super().save(*args, **kwargs)


def product_image_upload_path(instance, filename):
    product_slug = instance.slug or slugify(instance.name)
    return f"products/{product_slug}/{filename}"


class Product(TimeStampedModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["category", "name"], name="unique_product_name_per_category"),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        if self.price <= Decimal("0.00"):
            raise ValidationError({"price": "Price must be greater than zero."})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        self.name = self.name.strip()
        self.full_clean()
        super().save(*args, **kwargs)


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"


class PaymentMethod(models.TextChoices):
    WHATSAPP = "whatsapp", "WhatsApp"
    CARD = "card", "Card"
    CASH = "cash", "Cash"


class PaymentStatus(models.TextChoices):
    NOT_REQUIRED = "not_required", "Not required"
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"


class Order(TimeStampedModel):
    customer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    address = models.TextField()
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.WHATSAPP,
    )
    is_paid = models.BooleanField(default=False)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.NOT_REQUIRED,
    )
    payment_provider = models.CharField(max_length=30, blank=True)
    payment_token = models.CharField(max_length=255, blank=True)
    payment_conversation_id = models.CharField(max_length=80, blank=True)
    payment_id = models.CharField(max_length=80, blank=True)
    payment_error = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} - {self.full_name}"

    def clean(self):
        self.full_name = self.full_name.strip()
        self.phone = self.phone.strip()
        self.address = self.address.strip()
        if self.payment_method in {PaymentMethod.WHATSAPP, PaymentMethod.CASH} and self.is_paid:
            raise ValidationError({"is_paid": "WhatsApp and cash orders cannot be marked as paid at creation."})


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
