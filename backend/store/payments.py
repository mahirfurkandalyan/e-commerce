import json
from decimal import Decimal

import iyzipay
from django.conf import settings
from django.urls import reverse
from iyzipay.iyzipay_resource import IyzipayResource


class IyzicoConfigurationError(Exception):
    pass


class IyzicoPaymentError(Exception):
    pass


class CheckoutFormInitialize(IyzipayResource):
    def create(self, request, options):
        return self.connect("POST", "/payment/iyzipos/checkoutform/initialize/auth/ecom", options, request)


def _format_amount(value):
    return f"{Decimal(value).quantize(Decimal('0.01'))}"


def _read_iyzico_response(response):
    payload = response.read().decode("utf-8")
    if not payload:
        return {}
    return json.loads(payload)


def _options():
    if not settings.IYZICO_API_KEY or not settings.IYZICO_SECRET_KEY:
        raise IyzicoConfigurationError("Iyzico sandbox credentials are not configured.")

    return {
        "api_key": settings.IYZICO_API_KEY,
        "secret_key": settings.IYZICO_SECRET_KEY,
        "base_url": settings.IYZICO_BASE_URL,
    }


def create_checkout_session(request, order):
    callback_url = request.build_absolute_uri(reverse("store-api:iyzico-callback"))
    conversation_id = f"order-{order.id}"
    buyer_name_parts = order.full_name.split(maxsplit=1)
    buyer_name = buyer_name_parts[0]
    buyer_surname = buyer_name_parts[1] if len(buyer_name_parts) > 1 else "-"

    basket_items = []
    for item in order.items.select_related("product", "product__category").all():
        basket_items.append(
            {
                "id": str(item.product_id),
                "name": item.product.name,
                "category1": item.product.category.name,
                "itemType": "PHYSICAL",
                "price": _format_amount(item.price * item.quantity),
            }
        )

    checkout_request = {
        "locale": "tr",
        "conversationId": conversation_id,
        "price": _format_amount(order.total_price),
        "paidPrice": _format_amount(order.total_price),
        "currency": "TRY",
        "basketId": str(order.id),
        "paymentGroup": "PRODUCT",
        "callbackUrl": callback_url,
        "enabledInstallments": [1, 2, 3, 6, 9],
        "buyer": {
            "id": str(order.customer_id or order.id),
            "name": buyer_name,
            "surname": buyer_surname,
            "gsmNumber": order.phone,
            "email": "demo@example.com",
            "identityNumber": "11111111111",
            "registrationAddress": order.address,
            "ip": request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "127.0.0.1")).split(",")[0],
            "city": "Istanbul",
            "country": "Turkey",
        },
        "shippingAddress": {
            "contactName": order.full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": order.address,
        },
        "billingAddress": {
            "contactName": order.full_name,
            "city": "Istanbul",
            "country": "Turkey",
            "address": order.address,
        },
        "basketItems": basket_items,
    }

    data = _read_iyzico_response(CheckoutFormInitialize().create(checkout_request, _options()))
    if data.get("status") != "success":
        raise IyzicoPaymentError(data.get("errorMessage") or "Iyzico checkout session could not be created.")
    if not data.get("token") or not data.get("paymentPageUrl"):
        raise IyzicoPaymentError("Iyzico checkout session did not include a payment URL.")

    return {
        "conversation_id": conversation_id,
        "token": data.get("token", ""),
        "payment_page_url": data.get("paymentPageUrl", ""),
    }


def retrieve_checkout_result(token, conversation_id):
    result_request = {
        "locale": "tr",
        "conversationId": conversation_id,
        "token": token,
    }
    return _read_iyzico_response(iyzipay.CheckoutForm().retrieve(result_request, _options()))
