import time
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import OperationalError, connection, transaction

from store.models import AccountRole, Order, OrderItem, OrderStatus, PaymentMethod, Product, UserProfile


class Command(BaseCommand):
    help = "Clear existing orders and load demo customer orders for the admin panel."

    def handle(self, *args, **options):
        for attempt in range(1, 6):
            try:
                with connection.cursor() as cursor:
                    cursor.execute("PRAGMA busy_timeout = 5000;")
                with transaction.atomic():
                    return self._seed()
            except OperationalError as exc:
                if "database is locked" not in str(exc).lower() or attempt == 5:
                    raise
                time.sleep(1.5)

    def _seed(self):
        products = list(Product.objects.filter(is_active=True).order_by("id"))
        if len(products) < 4:
            raise CommandError("At least 4 active products are required before seeding demo orders.")

        preserved_admin_ids = list(
            UserProfile.objects.filter(role=AccountRole.ADMIN).values_list("user_id", flat=True)
        )

        deleted_orders, _ = Order.objects.all().delete()

        demo_customers = [
            {
                "username": "ayse.demir",
                "full_name": "Ayse Demir",
                "phone": "+90 532 111 22 33",
            },
            {
                "username": "mehmet.kaya",
                "full_name": "Mehmet Kaya",
                "phone": "+90 533 222 33 44",
            },
            {
                "username": "zeynep.arslan",
                "full_name": "Zeynep Arslan",
                "phone": "+90 534 333 44 55",
            },
            {
                "username": "can.yildiz",
                "full_name": "Can Yildiz",
                "phone": "+90 535 444 55 66",
            },
        ]

        created_customers = 0
        customer_map: dict[str, User] = {}

        for customer in demo_customers:
            user, was_created = User.objects.get_or_create(
                username=customer["username"],
                defaults={"first_name": customer["full_name"]},
            )
            if was_created:
                user.set_password("123456")
                user.save(update_fields=["password"])
                created_customers += 1

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    "full_name": customer["full_name"],
                    "role": AccountRole.CUSTOMER,
                    "phone": customer["phone"],
                },
            )
            customer_map[customer["username"]] = user

        removable_customers = UserProfile.objects.filter(role=AccountRole.CUSTOMER).exclude(
            user_id__in=[customer.id for customer in customer_map.values()]
        )
        removable_user_ids = list(removable_customers.values_list("user_id", flat=True))
        if removable_user_ids:
            User.objects.filter(id__in=removable_user_ids).exclude(id__in=preserved_admin_ids).delete()

        order_specs = [
            {
                "customer": "ayse.demir",
                "full_name": "Ayse Demir",
                "phone": "+90 532 111 22 33",
                "address": "Kadikoy, Istanbul - Moda Mah. Lale Sok. No: 18 Daire 4",
                "payment_method": PaymentMethod.CARD,
                "is_paid": True,
                "status": OrderStatus.CONFIRMED,
                "items": [(products[0], 1), (products[2], 2)],
            },
            {
                "customer": "mehmet.kaya",
                "full_name": "Mehmet Kaya",
                "phone": "+90 533 222 33 44",
                "address": "Bornova, Izmir - Kazim Dirik Mah. 372 Sok. No: 11",
                "payment_method": PaymentMethod.CASH,
                "is_paid": False,
                "status": OrderStatus.PENDING,
                "items": [(products[1], 1)],
            },
            {
                "customer": "zeynep.arslan",
                "full_name": "Zeynep Arslan",
                "phone": "+90 534 333 44 55",
                "address": "Cankaya, Ankara - Birlik Mah. 448 Cad. No: 27/8",
                "payment_method": PaymentMethod.WHATSAPP,
                "is_paid": False,
                "status": OrderStatus.SHIPPED,
                "items": [(products[3], 1), (products[4], 1), (products[5], 1)],
            },
            {
                "customer": "can.yildiz",
                "full_name": "Can Yildiz",
                "phone": "+90 535 444 55 66",
                "address": "Nilufer, Bursa - Cumhuriyet Mah. Tuna Cad. No: 5",
                "payment_method": PaymentMethod.CARD,
                "is_paid": True,
                "status": OrderStatus.DELIVERED,
                "items": [(products[2], 1), (products[5], 2)],
            },
            {
                "customer": "ayse.demir",
                "full_name": "Ayse Demir",
                "phone": "+90 532 111 22 33",
                "address": "Kadikoy, Istanbul - Moda Mah. Lale Sok. No: 18 Daire 4",
                "payment_method": PaymentMethod.CARD,
                "is_paid": True,
                "status": OrderStatus.DELIVERED,
                "items": [(products[4], 2)],
            },
        ]

        created_orders = 0
        created_items = 0

        for spec in order_specs:
            order = Order.objects.create(
                customer=customer_map.get(spec["customer"]),
                full_name=spec["full_name"],
                phone=spec["phone"],
                address=spec["address"],
                payment_method=spec["payment_method"],
                is_paid=spec["is_paid"],
                status=spec["status"],
                total_price=Decimal("0.00"),
            )

            total_price = Decimal("0.00")
            items = []

            for product, quantity in spec["items"]:
                line_total = product.price * quantity
                total_price += line_total
                items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price=product.price,
                    )
                )

            OrderItem.objects.bulk_create(items)
            order.total_price = total_price
            order.save(update_fields=["total_price"])

            created_orders += 1
            created_items += len(items)

        self.stdout.write(self.style.SUCCESS("Demo orders are ready."))
        self.stdout.write(f"Deleted existing order records: {deleted_orders}")
        self.stdout.write(f"Demo customers ensured: {len(demo_customers)} (new: {created_customers})")
        self.stdout.write(f"Orders created: {created_orders}")
        self.stdout.write(f"Order items created: {created_items}")
