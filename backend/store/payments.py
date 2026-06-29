import json
import logging
from decimal import Decimal

import iyzipay
from django.conf import settings
from django.urls import reverse
from iyzipay.iyzipay_resource import IyzipayResource

logger = logging.getLogger(__name__)


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
    logger.warning("Iyzico response body: %s", payload)
    if not payload:
        return {}
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise IyzicoPaymentError(f"Iyzico response is not valid JSON: {payload}") from exc


def _options():
    missing = []
    if not settings.IYZICO_API_KEY:
        missing.append("IYZICO_API_KEY")
    if not settings.IYZICO_SECRET_KEY:
        missing.append("IYZICO_SECRET_KEY")
    if not settings.IYZICO_BASE_URL:
        missing.append("IYZICO_BASE_URL")
    if missing:
        raise IyzicoConfigurationError(f"Missing Iyzico environment variables: {', '.join(missing)}")

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

    logger.warning("Iyzico checkout initialize request for order %s: %s", order.id, json.dumps(checkout_request, ensure_ascii=False))
    logger.warning("Iyzico callback URL for order %s: %s", order.id, callback_url)

    try:
        data = _read_iyzico_response(CheckoutFormInitialize().create(checkout_request, _options()))
    except IyzicoConfigurationError:
        raise
    except IyzicoPaymentError:
        raise
    except Exception as exc:
        raise IyzicoPaymentError(f"Iyzico checkout initialize request failed: {exc}") from exc

    logger.warning("Iyzico checkout initialize parsed response for order %s: %s", order.id, json.dumps(data, ensure_ascii=False))

    if data.get("status") != "success":
        error_message = data.get("errorMessage") or data.get("errorCode") or "Iyzico checkout session could not be created."
        raise IyzicoPaymentError(f"Iyzico checkout initialize failed: {error_message}")
    if not data.get("token") or not data.get("paymentPageUrl"):
        raise IyzicoPaymentError(f"Iyzico checkout session did not include token/paymentPageUrl. Response: {data}")

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
    logger.warning("Iyzico checkout retrieve request: %s", json.dumps(result_request, ensure_ascii=False))

    try:
        data = _read_iyzico_response(iyzipay.CheckoutForm().retrieve(result_request, _options()))
    except IyzicoConfigurationError:
        raise
    except IyzicoPaymentError:
        raise
    except Exception as exc:
        raise IyzicoPaymentError(f"Iyzico checkout retrieve request failed: {exc}") from exc

    logger.warning("Iyzico checkout retrieve parsed response: %s", json.dumps(data, ensure_ascii=False))
    return data
