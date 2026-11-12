"""Thin client for Senjaropay card payments (https://docs.senjaropay.com), used for USD.

The tourist pays on Senjaropay's hosted card page (`checkout_url`); this site never sees
the card. create_card_payment opens that page, get_card_payment reads where it stands.
Every call is a POST authenticated with a key/secret pair, and each API scope has its
own pair: payments:create to open a checkout, payments:read to check one.

Senjaropay doesn't document how its webhooks are signed, so a webhook is never trusted
on its own: SenjaropayWebhookView only uses it as a prompt to ask get_card_payment.
Plain urllib, like bookings.snippe, so tests can stub `_request`.
"""

import json
import logging
import urllib.error
import urllib.request
import uuid
from decimal import Decimal, InvalidOperation

from django.conf import settings

logger = logging.getLogger(__name__)

PAY_PATH = "/senjaropay/merchant/card/pay"
STATUS_PATH = "/senjaropay/merchant/card/status"
REQUEST_TIMEOUT_SECONDS = 15

# What a card payment's `status` means once it has one. Anything else is still pending.
COMPLETED_STATUSES = {"completed", "success", "successful", "paid"}
FAILED_STATUSES = {"failed", "declined", "cancelled", "canceled", "rejected"}
EXPIRED_STATUSES = {"expired"}


class SenjaropayError(Exception):
    """Senjaropay couldn't be reached, or answered with an error."""


def is_configured():
    return all(
        (
            settings.SENJAROPAY_PAYMENTS_CREATE_KEY,
            settings.SENJAROPAY_PAYMENTS_CREATE_SECRET,
            settings.SENJAROPAY_PAYMENTS_READ_KEY,
            settings.SENJAROPAY_PAYMENTS_READ_SECRET,
        )
    )


def _request(path, payload, *, key, secret, idempotency_key=None):
    request = urllib.request.Request(
        settings.SENJAROPAY_API_URL + path,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "x-api-key": key,
            "x-api-secret": secret,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    if idempotency_key:
        request.add_header("x-idempotency-key", idempotency_key)
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        raise SenjaropayError(f"Senjaropay POST {path} returned {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise SenjaropayError(f"Senjaropay POST {path} failed: {exc}") from exc


def create_card_payment(*, amount, currency, customer):
    """Opens a hosted card checkout and returns Senjaropay's `data` object (reference,
    checkout_url, expires_at, status). `customer` needs firstname, lastname,
    phone_number, email, country, city and address — Senjaropay requires all seven."""
    payload = {
        "payment_type": "card",
        "details": {"amount": amount, "currency": currency},
        "customer": customer,
        # The docs ask for "" when the payment isn't for a sub-merchant.
        "submerchant_id": "",
    }
    if settings.SENJAROPAY_WEBHOOK_URL:
        payload["webhook_url"] = settings.SENJAROPAY_WEBHOOK_URL
    else:
        # The API reference marks webhook_url required; Senjaropay then falls back to
        # whatever URL the dashboard has. Payments still confirm through status checks.
        logger.warning("SENJAROPAY_WEBHOOK_URL is not set; Senjaropay will use the dashboard's webhook URL")
    data = (
        _request(
            PAY_PATH,
            payload,
            key=settings.SENJAROPAY_PAYMENTS_CREATE_KEY,
            secret=settings.SENJAROPAY_PAYMENTS_CREATE_SECRET,
            # A fresh key per checkout: payment ids repeat across databases (local and
            # production share one Senjaropay account), so they can't be the key.
            idempotency_key=str(uuid.uuid4()),
        ).get("data")
        or {}
    )
    if not data.get("reference") or not data.get("checkout_url"):
        raise SenjaropayError("Senjaropay created a card payment without a reference or checkout URL")
    return data


def get_card_payment(reference):
    return (
        _request(
            STATUS_PATH,
            {"reference": reference},
            key=settings.SENJAROPAY_PAYMENTS_READ_KEY,
            secret=settings.SENJAROPAY_PAYMENTS_READ_SECRET,
        ).get("data")
        or {}
    )


def _whole_number(value):
    # Amounts come back as 1, 1.0 or "1.00"; prices here are whole units.
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return value
    return int(number) if number == number.to_integral_value() else number


def paid_amount(data, fallback_currency):
    """(value, currency) from a status response, whose `amount` may be a number or an
    {"value", "currency"} object."""
    amount = data.get("amount")
    currency = data.get("currency") or fallback_currency
    if isinstance(amount, dict):
        currency = amount.get("currency") or currency
        amount = amount.get("value")
    return _whole_number(amount), currency
