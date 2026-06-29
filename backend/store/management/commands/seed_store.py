from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from store.models import AccountRole, Category, Product, Store, UserProfile


class Command(BaseCommand):
    help = "Seed the project with a default store, categories, and products for local development."

    def handle(self, *args, **options):
        admin_user, admin_created = User.objects.get_or_create(
            username="yonetici",
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Mağaza Yöneticisi",
            },
        )
        if admin_created:
            admin_user.set_password("123456")
            admin_user.save()
        UserProfile.objects.update_or_create(
            user=admin_user,
            defaults={
                "full_name": "Mağaza Yöneticisi",
                "role": AccountRole.ADMIN,
                "phone": "+90 555 000 00 01",
            },
        )

        customer_user, customer_created = User.objects.get_or_create(
            username="musteri",
            defaults={
                "first_name": "Demo Müşteri",
            },
        )
        if customer_created:
            customer_user.set_password("123456")
            customer_user.save()
        UserProfile.objects.update_or_create(
            user=customer_user,
            defaults={
                "full_name": "Demo Müşteri",
                "role": AccountRole.CUSTOMER,
                "phone": "+90 555 000 00 02",
            },
        )

        store, created = Store.objects.get_or_create(
            pk=1,
            defaults={
                "name": "Northstar Goods",
                "primary_color": "#0F766E",
                "phone_number": "+90 555 000 00 00",
                "address": "Istanbul, Turkey",
                "description": "Premium daily essentials curated for a fast demo shopping flow.",
            },
        )

        if not created:
            store.name = "Northstar Goods"
            store.primary_color = "#0F766E"
            store.phone_number = "+90 555 000 00 00"
            store.address = "Istanbul, Turkey"
            store.description = "Premium daily essentials curated for a fast demo shopping flow."
            store.save()

        catalog = {
            "Home Office": [
                {
                    "name": "Walnut Desk Stand",
                    "description": "Elevated wooden stand for cleaner laptop ergonomics and a calmer desk setup.",
                    "price": Decimal("89.90"),
                    "stock": 18,
                },
                {
                    "name": "Soft Task Lamp",
                    "description": "Warm ambient desk light with a minimal silhouette for focused work sessions.",
                    "price": Decimal("64.50"),
                    "stock": 12,
                },
            ],
            "Daily Carry": [
                {
                    "name": "Slate Bottle",
                    "description": "Insulated metal bottle designed for everyday carry with a matte finish.",
                    "price": Decimal("34.90"),
                    "stock": 26,
                },
                {
                    "name": "Transit Tote",
                    "description": "Structured tote bag with clean compartments for laptop, cables, and essentials.",
                    "price": Decimal("72.00"),
                    "stock": 9,
                },
            ],
            "Living": [
                {
                    "name": "Stone Aroma Candle",
                    "description": "Balanced cedar and citrus candle for a premium home atmosphere.",
                    "price": Decimal("28.90"),
                    "stock": 30,
                },
                {
                    "name": "Textured Throw",
                    "description": "Heavy knit throw blanket with neutral tones for modern interiors.",
                    "price": Decimal("58.00"),
                    "stock": 14,
                },
            ],
        }

        created_products = 0

        for category_name, products in catalog.items():
            category, _ = Category.objects.get_or_create(name=category_name)

            for product_data in products:
                product, was_created = Product.objects.get_or_create(
                    category=category,
                    name=product_data["name"],
                    defaults={
                        "description": product_data["description"],
                        "price": product_data["price"],
                        "stock": product_data["stock"],
                        "is_active": True,
                    },
                )

                if not was_created:
                    product.description = product_data["description"]
                    product.price = product_data["price"]
                    product.stock = product_data["stock"]
                    product.is_active = True
                    product.save()
                else:
                    created_products += 1

        self.stdout.write(self.style.SUCCESS("Store mock data is ready."))
        self.stdout.write(f"Store: {store.name}")
        self.stdout.write(f"Categories: {Category.objects.count()}")
        self.stdout.write(f"Products: {Product.objects.count()} (new: {created_products})")
        self.stdout.write("Admin login: yonetici / 123456")
        self.stdout.write("Customer login: musteri / 123456")
