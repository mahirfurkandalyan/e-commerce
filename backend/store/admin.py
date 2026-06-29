from django.contrib import admin

from store.models import Category, Order, OrderItem, Product, Store, UserProfile


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("name", "phone_number", "primary_color")
    search_fields = ("name", "phone_number", "address")
    fieldsets = (
        ("Brand", {"fields": ("name", "logo", "primary_color", "description")}),
        ("Contact", {"fields": ("phone_number", "address")}),
    )

    def has_add_permission(self, request):
        if Store.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("-created_at",)
    list_per_page = 25


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "stock", "is_active", "created_at")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "slug", "description", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    list_select_related = ("category",)
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    list_per_page = 25


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "price")
    min_num = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "customer", "phone", "payment_method", "is_paid", "status", "total_price", "created_at")
    list_filter = ("status", "payment_method", "is_paid", "created_at")
    search_fields = ("full_name", "phone", "customer__username")
    inlines = (OrderItemInline,)
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    list_per_page = 25


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product", "quantity", "price")
    list_filter = ("order__status", "order__created_at")
    search_fields = ("order__full_name", "order__phone", "product__name", "product__slug")
    autocomplete_fields = ("order", "product")
    ordering = ("-order__created_at", "-id")
    list_select_related = ("order", "product")
    list_per_page = 25


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "role", "phone")
    list_filter = ("role",)
    search_fields = ("full_name", "user__username", "phone")
    autocomplete_fields = ("user",)
