import logging
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.db.models import Q, Sum
from django.db.models.deletion import ProtectedError
from django.db import transaction
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, permissions, serializers, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from store.models import Category, Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Product, Store
from store.payments import (
    IyzicoConfigurationError,
    IyzicoPaymentError,
    create_checkout_session,
    retrieve_checkout_result,
)
from store.permissions import IsAdminRole, IsAuthenticatedCustomer
from store.serializers import (
    AdminOrderUpdateSerializer,
    AdminOverviewSerializer,
    AdminProductWriteSerializer,
    AuthUserSerializer,
    CategoryListSerializer,
    LoginSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    RegisterSerializer,
    StoreSerializer,
    StoreStatsSerializer,
)

logger = logging.getLogger(__name__)

PUBLIC_CACHE_TTL = 60 * 5


def serialize_user(user):
    profile = getattr(user, "profile", None)
    role = profile.role if profile else ("admin" if user.is_staff or user.is_superuser else "customer")
    full_name = (profile.full_name if profile else user.get_full_name() or user.username).strip()
    return AuthUserSerializer(
        {
            "id": user.id,
            "username": user.username,
            "full_name": full_name,
            "role": role,
        }
    ).data


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "store-api"})


class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"].strip(),
            password=serializer.validated_data["password"],
        )
        if not user:
            raise serializers.ValidationError({"detail": "Kullanıcı adı veya şifre hatalı."})

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": serialize_user(user)})


class RegisterAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": serialize_user(user)}, status=status.HTTP_201_CREATED)


class MeAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(serialize_user(request.user))


class LogoutAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Oturum kapatıldı."})


class StoreAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    @method_decorator(cache_page(PUBLIC_CACHE_TTL))
    def get(self, request):
        store = Store.objects.only(
            "id",
            "name",
            "logo",
            "primary_color",
            "phone_number",
            "address",
            "description",
        ).first()
        if not store:
            raise serializers.ValidationError({"store": "Store configuration is not available yet."})
        return Response(StoreSerializer(store).data)


@method_decorator(cache_page(PUBLIC_CACHE_TTL), name="dispatch")
class CategoryListAPIView(generics.ListAPIView):
    queryset = Category.objects.only("id", "name", "slug").all()
    serializer_class = CategoryListSerializer
    authentication_classes = []
    permission_classes = []


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    authentication_classes = []
    permission_classes = []

    def get_queryset(self):
        queryset = (
            Product.objects.select_related("category")
            .only(
                "id",
                "name",
                "slug",
                "description",
                "price",
                "stock",
                "image",
                "is_active",
                "category__id",
                "category__name",
                "category__slug",
            )
            .filter(is_active=True)
        )
        category_slug = self.request.query_params.get("category", "").strip()
        search = self.request.query_params.get("search", "").strip()
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
            )
        return queryset


class ProductDetailAPIView(generics.RetrieveAPIView):
    queryset = Product.objects.select_related("category").only(
        "id",
        "name",
        "slug",
        "description",
        "price",
        "stock",
        "image",
        "is_active",
        "created_at",
        "category__id",
        "category__name",
        "category__slug",
    ).filter(is_active=True)
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"
    authentication_classes = []
    permission_classes = []


class AdminOverviewAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request):
        serializer = AdminOverviewSerializer(
            {
                "total_products": Product.objects.count(),
                "active_products": Product.objects.filter(is_active=True).count(),
                "low_stock_products": Product.objects.filter(is_active=True, stock__lte=5).count(),
                "total_orders": Order.objects.count(),
                "pending_orders": Order.objects.filter(status=OrderStatus.PENDING).count(),
                "total_revenue": Order.objects.aggregate(total=Sum("total_price")).get("total") or Decimal("0.00"),
            }
        )
        return Response(serializer.data)


class AdminProductListCreateAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = AdminProductWriteSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminRole]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        category_id = self.request.query_params.get("category", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
            )
        if category_id.isdigit():
            queryset = queryset.filter(category_id=int(category_id))
        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)

        return queryset

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        cache.delete("store:stats")
        return response


class AdminProductManageAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = AdminProductWriteSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminRole]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        cache.delete("store:stats")
        return response

    def delete(self, request, *args, **kwargs):
        try:
            response = self.destroy(request, *args, **kwargs)
        except ProtectedError:
            raise serializers.ValidationError(
                {"detail": "Bu ürün sipariş kayıtlarında kullanıldığı için silinemez."}
            )

        cache.delete("store:stats")
        return response


class AdminOrderListAPIView(generics.ListAPIView):
    queryset = Order.objects.prefetch_related("items__product").all()
    serializer_class = OrderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status", "").strip()
        if status_filter and status_filter in OrderStatus.values:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminOrderManageAPIView(generics.UpdateAPIView):
    queryset = Order.objects.prefetch_related("items__product").all()
    serializer_class = AdminOrderUpdateSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminRole]

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        cache.delete("store:stats")
        return response


class OrderCreateAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        logger.warning("Order create request body: %s", request.data)
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data.pop("items")
        product_ids = [item["product"].id for item in items_data]
        products = Product.objects.select_for_update().filter(id__in=product_ids, is_active=True)
        product_map = {product.id: product for product in products}

        if len(product_map) != len(set(product_ids)):
            raise serializers.ValidationError({"items": "One or more selected products are unavailable."})

        total_price = Decimal("0.00")
        order = Order.objects.create(
            customer=request.user if getattr(request.user, "is_authenticated", False) and not request.user.is_staff else None,
            payment_status=PaymentStatus.PENDING if serializer.validated_data["payment_method"] == PaymentMethod.CARD else PaymentStatus.NOT_REQUIRED,
            **serializer.validated_data,
        )
        order_items = []

        for item in items_data:
            product = product_map[item["product"].id]
            quantity = item["quantity"]

            if product.stock < quantity:
                raise serializers.ValidationError(
                    {"items": f"Insufficient stock for product '{product.name}'."}
                )

            line_price = product.price
            total_price += line_price * quantity
            product.stock -= quantity
            product.save(update_fields=["stock"])

            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=line_price,
                )
            )

        OrderItem.objects.bulk_create(order_items)
        order.total_price = total_price
        order.save(update_fields=["total_price"])
        cache.delete("store:stats")
        order = Order.objects.prefetch_related("items__product").get(pk=order.pk)

        response_data = OrderSerializer(order).data
        response_data.update(self._build_payment_response(order))
        logger.warning("Order create response body for order %s: %s", order.id, response_data)
        return Response(response_data, status=status.HTTP_201_CREATED)

    def _build_whatsapp_message(self, order):
        lines = [
            "New order request",
            f"Order ID: {order.id}",
            f"Customer: {order.full_name}",
            f"Phone: {order.phone}",
            f"Address: {order.address}",
            f"Payment method: {order.get_payment_method_display()}",
            "Items:",
        ]

        for item in order.items.select_related("product").all():
            lines.append(f"- {item.product.name} x {item.quantity} = {item.price * item.quantity}")

        lines.append(f"Total: {order.total_price}")
        return "\n".join(lines)

    def _build_payment_response(self, order):
        if order.payment_method == PaymentMethod.WHATSAPP:
            return {
                "payment_flow": "whatsapp",
                "whatsapp_message": self._build_whatsapp_message(order),
                "payment_message": "Continue the order in WhatsApp.",
            }

        if order.payment_method == PaymentMethod.CARD:
            try:
                session = create_checkout_session(self.request, order)
            except (IyzicoConfigurationError, IyzicoPaymentError) as exc:
                logger.exception("Iyzico payment setup failed for order %s: %s", order.id, exc)
                order.payment_status = PaymentStatus.FAILED
                order.payment_provider = "iyzico"
                order.payment_error = str(exc)
                order.save(update_fields=["payment_status", "payment_provider", "payment_error"])
                raise serializers.ValidationError({"payment": str(exc)})
            except Exception as exc:
                logger.exception("Unexpected card payment setup error for order %s: %s", order.id, exc)
                order.payment_status = PaymentStatus.FAILED
                order.payment_provider = "iyzico"
                order.payment_error = str(exc)
                order.save(update_fields=["payment_status", "payment_provider", "payment_error"])
                raise serializers.ValidationError({"payment": f"Unexpected card payment setup error: {exc}"})

            order.payment_provider = "iyzico"
            order.payment_token = session["token"]
            order.payment_conversation_id = session["conversation_id"]
            order.save(update_fields=["payment_provider", "payment_token", "payment_conversation_id"])

            return {
                "payment_flow": "card",
                "payment_message": "Iyzico test ödeme sayfasına yönlendiriliyorsunuz.",
                "payment_session": {
                    "provider": "iyzico",
                    "status": "pending",
                    "payment_page_url": session["payment_page_url"],
                },
                "whatsapp_message": None,
            }

        return {
            "payment_flow": "cash",
            "payment_message": "Cash payment selected. Collect payment on delivery or pickup.",
            "whatsapp_message": self._build_whatsapp_message(order),
        }


class StoreStatsAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        cache_key = "store:stats"
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return Response(cached_stats)

        serializer = StoreStatsSerializer(
            {
                "order_count": Order.objects.count(),
                "active_product_count": Product.objects.filter(is_active=True).count(),
            }
        )
        cache.set(cache_key, serializer.data, PUBLIC_CACHE_TTL)
        return Response(serializer.data)


class IyzicoCallbackAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        logger.warning("Iyzico callback request body: %s", request.data or request.POST)
        token = (request.data.get("token") or request.POST.get("token") or "").strip()
        if not token:
            return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=failed&reason=missing-token")

        try:
            order = Order.objects.get(payment_token=token, payment_provider="iyzico")
        except Order.DoesNotExist:
            return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=failed&reason=order-not-found")

        try:
            data = retrieve_checkout_result(token, order.payment_conversation_id)
        except (IyzicoConfigurationError, IyzicoPaymentError, ValueError) as exc:
            logger.exception("Iyzico callback retrieve failed for order %s: %s", order.id, exc)
            order.payment_status = PaymentStatus.FAILED
            order.payment_error = str(exc)
            order.save(update_fields=["payment_status", "payment_error"])
            return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=failed&order={order.id}")
        except Exception as exc:
            logger.exception("Unexpected iyzico callback error for order %s: %s", order.id, exc)
            order.payment_status = PaymentStatus.FAILED
            order.payment_error = str(exc)
            order.save(update_fields=["payment_status", "payment_error"])
            return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=failed&order={order.id}")

        logger.warning("Iyzico callback parsed response for order %s: %s", order.id, data)
        if data.get("status") == "success" and data.get("paymentStatus") == "SUCCESS":
            order.is_paid = True
            order.payment_status = PaymentStatus.PAID
            order.status = OrderStatus.CONFIRMED
            order.payment_id = str(data.get("paymentId") or "")
            order.payment_error = ""
            order.save(update_fields=["is_paid", "payment_status", "status", "payment_id", "payment_error"])
            cache.delete("store:stats")
            return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=success&order={order.id}")

        order.payment_status = PaymentStatus.FAILED
        order.payment_error = data.get("errorMessage") or data.get("errorCode") or "Iyzico payment failed."
        order.save(update_fields=["payment_status", "payment_error"])
        return redirect(f"{settings.FRONTEND_BASE_URL}/payment-result?status=failed&order={order.id}")


class CustomerOrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustomer]

    def get_queryset(self):
        return Order.objects.prefetch_related("items__product").filter(customer=self.request.user)
