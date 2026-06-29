import base64
import hashlib
import hmac
import http.client
import json
import logging
import secrets
import string
from decimal import Decimal
from urllib.parse import urlparse

from django.conf import settings
from django.urls import reverse

logger = logging.getLogger(__name__)

CHECKOUT_INITIALIZE_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
CHECKOUT_RETRIEVE_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail"


class IyzicoConfigurationError(Exception):
    pass


class IyzicoPaymentError(Exception):
    pass


def _format_amount(value):
    return f"{Decimal(value).quantize(Decimal('0.01'))}"


def _clean_env_value(value):
    return (value or "").strip().strip('"').strip("'")


def _clean_base_url(value):
    base_url = _clean_env_value(value)
    if base_url.startswith(("http://", "https://")):
        parsed = urlparse(base_url)
        base_url = parsed.netloc or parsed.path
    return base_url.rstrip("/")


def _options():
    api_key = _clean_env_value(settings.IYZICO_API_KEY)
    secret_key = _clean_env_value(settings.IYZICO_SECRET_KEY)
    base_url = _clean_base_url(settings.IYZICO_BASE_URL)

    missing = []
    if not api_key:
        missing.append("IYZICO_API_KEY")
    if not secret_key:
        missing.append("IYZICO_SECRET_KEY")
    if not base_url:
        missing.append("IYZICO_BASE_URL")
    if missing:
        raise IyzicoConfigurationError(f"Missing Iyzico environment variables: {', '.join(missing)}")

    return {
        "api_key": api_key,
        "secret_key": secret_key,
        "base_url": base_url,
    }


def _random_key(length=8):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _authorization_header(options, path, random_key, body):
    signature_payload = (random_key + path + body).encode("utf-8")
    signature = hmac.new(options["secret_key"].encode("utf-8"), signature_payload, hashlib.sha256).hexdigest()
    authorization_params = [
        "apiKey:" + options["api_key"],
        "randomKey:" + random_key,
        "signature:" + signature,
    ]
    return "IYZWSv2 " + base64.b64encode("&".join(authorization_params).encode("utf-8")).decode("utf-8")


def _post_iyzico(path, payload):
    options = _options()
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    random_key = _random_key()
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-iyzi-client-version": "custom-python-http",
        "x-iyzi-rnd": random_key,
        "Authorization": _authorization_header(options, path, random_key, body),
    }

    logger.warning("Iyzico POST %s on host %s", path, options["base_url"])
    logger.warning("Iyzico request body: %s", body)

    connection = http.client.HTTPSConnection(options["base_url"], timeout=30)
    try:
        connection.request("POST", path, body.encode("utf-8"), headers)
        response = connection.getresponse()
        raw_body = response.read().decode("utf-8")
    finally:
        connection.close()

    logger.warning("Iyzico HTTP status: %s", response.status)
    logger.warning("Iyzico response body: %s", raw_body)

    if not raw_body:
        raise IyzicoPaymentError(f"Iyzico returned empty response with status {response.status}.")

    try:
        data = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise IyzicoPaymentError(f"Iyzico response is not valid JSON: {raw_body}") from exc

    if response.status < 200 or response.status >= 300:
        error_message = data.get("errorMessage") or data.get("errorCode") or raw_body
        raise IyzicoPaymentError(f"Iyzico HTTP {response.status}: {error_message}")

    return data


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
        data = _post_iyzico(CHECKOUT_INITIALIZE_PATH, checkout_request)
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
        data = _post_iyzico(CHECKOUT_RETRIEVE_PATH, result_request)
    except IyzicoConfigurationError:
        raise
    except IyzicoPaymentError:
        raise
    except Exception as exc:
        raise IyzicoPaymentError(f"Iyzico checkout retrieve request failed: {exc}") from exc

    logger.warning("Iyzico checkout retrieve parsed response: %s", json.dumps(data, ensure_ascii=False))
    return data
