import re

from django.contrib.auth.models import User
from rest_framework import serializers

from store.models import AccountRole, Category, Order, OrderItem, OrderStatus, PaymentMethod, Product, Store, UserProfile


class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryListSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "category",
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategoryListSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "created_at",
            "category",
        )


class AdminProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )
    category = CategoryListSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "stock",
            "image",
            "is_active",
            "category",
            "category_id",
            "created_at",
        )
        read_only_fields = ("id", "slug", "category", "created_at")


class AdminOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status", "is_paid")

    def validate_status(self, value):
        if value not in OrderStatus.values:
            raise serializers.ValidationError("Unsupported order status.")
        return value

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", None))
        is_paid = attrs.get("is_paid", getattr(self.instance, "is_paid", False))

        if is_paid and status_value == OrderStatus.PENDING:
            raise serializers.ValidationError({"status": "Paid orders cannot stay in pending status."})

        return attrs


class AdminOverviewSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class AuthUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    role = serializers.CharField()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(min_length=3, max_length=200)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Bu kullanıcı adı zaten kullanılıyor.")
        return value

    def create(self, validated_data):
        username = validated_data["username"].strip()
        password = validated_data["password"]
        full_name = validated_data["full_name"].strip()
        phone = validated_data.get("phone", "").strip()

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=full_name,
        )
        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            role=AccountRole.CUSTOMER,
            phone=phone,
        )
        return user


class OrderItemCreateSerializer(serializers.Serializer):
    product = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Product.objects.filter(is_active=True),
    )
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_name", "product_slug", "quantity", "price", "line_total")

    def get_line_total(self, obj):
        return obj.price * obj.quantity


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ("customer", "full_name", "phone", "address", "payment_method", "items")
        read_only_fields = ("customer",)

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Full name must be at least 3 characters.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        if not re.fullmatch(r"^\+?[0-9\s\-()]{8,20}$", value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_address(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Address must be at least 10 characters.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        product_slugs = [item["product"].slug for item in value]
        if len(product_slugs) != len(set(product_slugs)):
            raise serializers.ValidationError("Each product can only appear once per order.")
        return value

    def validate_payment_method(self, value):
        if value not in PaymentMethod.values:
            raise serializers.ValidationError("Unsupported payment method.")
        return value


class StoreStatsSerializer(serializers.Serializer):
    order_count = serializers.IntegerField()
    active_product_count = serializers.IntegerField()


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = (
            "id",
            "name",
            "logo",
            "primary_color",
            "phone_number",
            "address",
            "description",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "full_name",
            "phone",
            "address",
            "payment_method",
            "is_paid",
            "payment_status",
            "payment_provider",
            "total_price",
            "status",
            "created_at",
            "customer_username",
            "items",
        )
