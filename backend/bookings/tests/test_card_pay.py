"""USD card payments through Senjaropay's hosted page: opening one, confirming it from
Senjaropay's status API (never from the webhook body), and closing failed ones."""

from datetime import timedelta
from itertools import count
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings import senjaropay
from bookings.models import Booking, Invoice, Payment
from bookings.payments import reconcile_open_payments
from bookings.tests.test_pay import make_booking

User = get_user_model()

SENJAROPAY_SETTINGS = {
    "SENJAROPAY_PAYMENTS_CREATE_KEY": "create_key",
    "SENJAROPAY_PAYMENTS_CREATE_SECRET": "create_secret",
    "SENJAROPAY_PAYMENTS_READ_KEY": "read_key",
    "SENJAROPAY_PAYMENTS_READ_SECRET": "read_secret",
    "SENJAROPAY_WEBHOOK_URL": "https://api.example.com/api/payments/senjaropay/webhook/",
}
BILLING = {"phone_number": "+1 (415) 555-0100", "country": "United States", "city": "Austin", "address": "1 Main St"}


class FakeSenjaropay:
    """Stands in for Senjaropay's card API: records each request; `set_status` decides
    what the status endpoint reports next."""

    def __init__(self):
        self.requests = []
        self.payments = {}
        self._ids = count(1)

    def __call__(self, path, payload, *, key, secret, idempotency_key=None):
        self.requests.append((path, payload, key, idempotency_key))
        if path == senjaropay.PAY_PATH:
            reference = f"CARD-{next(self._ids)}"
            self.payments[reference] = {
                "reference": reference,
                "status": "pending",
                "amount": {"value": payload["details"]["amount"], "currency": payload["details"]["currency"]},
            }
            return {"status": "success", "data": {**self.payments[reference], "checkout_url": f"https://cardpay.example/{reference}"}}
        return {"status": "success", "data": self.payments[payload["reference"]]}

    def set_status(self, reference, value, **extra):
        self.payments[reference].update(status=value, **extra)


@override_settings(**SENJAROPAY_SETTINGS)
class CardPaymentTests(APITestCase):
    def setUp(self):
        self.fake = FakeSenjaropay()
        patcher = mock.patch.object(senjaropay, "_request", self.fake)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.booking = make_booking(self.customer)
        self.booking.currency = "USD"
        self.booking.save(update_fields=["currency"])
        self.booking.safari.price_usd = 100
        self.booking.safari.save(update_fields=["price_usd"])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def pay(self, **body):
        return self.client.post(reverse("booking-pay", args=[self.booking.id]), {"billing": BILLING, **body}, format="json")

    def status_of(self, payment_id):
        return self.client.get(reverse("booking-payment-status", args=[self.booking.id, payment_id]))

    def test_opens_a_card_checkout_in_usd(self):
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["mode"], "card")
        self.assertEqual(response.data["currency"], "USD")
        self.assertEqual(response.data["checkout_url"], "https://cardpay.example/CARD-1")
        path, payload, key, idempotency_key = self.fake.requests[0]
        self.assertEqual(path, senjaropay.PAY_PATH)
        self.assertEqual(key, "create_key")
        self.assertTrue(idempotency_key)
        self.assertEqual(payload["details"]["currency"], "USD")
        self.assertEqual(payload["customer"]["firstname"], "Mark")
        self.assertEqual(payload["customer"]["phone_number"], "14155550100")
        self.assertEqual(payload["webhook_url"], SENJAROPAY_SETTINGS["SENJAROPAY_WEBHOOK_URL"])
        self.assertEqual(payload["submerchant_id"], "")
        payment = Payment.objects.get(pk=response.data["payment_id"])
        self.assertEqual((payment.provider, payment.mode), ("senjaropay", "card"))

    def test_billing_details_are_required(self):
        response = self.client.post(reverse("booking-pay", args=[self.booking.id]), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "billing_required")
        self.assertEqual(self.fake.requests, [])

    def test_clicking_pay_twice_reuses_the_open_checkout(self):
        first = self.pay().data["payment_id"]
        second = self.pay().data["payment_id"]
        self.assertEqual(first, second)
        self.assertEqual(len(self.fake.requests), 1)

    def test_completed_status_records_the_deposit(self):
        payment_id = self.pay().data["payment_id"]
        payment = Payment.objects.get(pk=payment_id)
        self.fake.set_status(payment.session_reference, "COMPLETED")
        response = self.status_of(payment_id)
        self.assertEqual(response.data["status"], "completed")
        self.assertEqual(self.fake.requests[-1][2], "read_key")
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.amount, payment.amount)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)

    def test_a_different_amount_is_not_applied(self):
        payment_id = self.pay().data["payment_id"]
        payment = Payment.objects.get(pk=payment_id)
        self.fake.set_status(payment.session_reference, "COMPLETED", amount={"value": 1, "currency": "USD"})
        self.status_of(payment_id)
        payment.refresh_from_db()
        self.assertIn("Senjaropay reported", payment.needs_attention)
        self.assertFalse(Invoice.objects.exists())

    def test_failed_status_closes_the_payment(self):
        payment_id = self.pay().data["payment_id"]
        self.fake.set_status(Payment.objects.get(pk=payment_id).session_reference, "FAILED")
        self.assertEqual(self.status_of(payment_id).data["status"], "failed")

    def test_webhook_body_is_not_trusted(self):
        """A webhook claiming success changes nothing while Senjaropay's API says pending."""
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        body = {"data": {"reference": payment.session_reference, "status": "COMPLETED"}}
        response = self.client.post(reverse("senjaropay-webhook"), body, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.STATUS_PENDING)

        self.fake.set_status(payment.session_reference, "COMPLETED")
        self.client.post(reverse("senjaropay-webhook"), body, format="json")
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.STATUS_COMPLETED)

    def test_reconcile_confirms_card_payments_and_expires_abandoned_ones(self):
        paid = Payment.objects.get(pk=self.pay().data["payment_id"])
        self.fake.set_status(paid.session_reference, "COMPLETED")
        abandoned = Payment.objects.create(
            booking=make_booking(self.customer), kind=Payment.KIND_DEPOSIT, mode=Payment.MODE_CARD,
            provider="senjaropay", currency="USD", amount=30, session_reference="CARD-OLD",
        )
        Payment.objects.filter(pk=abandoned.pk).update(created_at=timezone.now() - timedelta(hours=3))
        self.fake.payments["CARD-OLD"] = {"reference": "CARD-OLD", "status": "pending"}
        counts = reconcile_open_payments()
        self.assertEqual(counts, {"checked": 2, "completed": 1, "closed": 1})
        abandoned.refresh_from_db()
        self.assertEqual(abandoned.status, Payment.STATUS_EXPIRED)

    def test_return_page_finds_the_tourists_own_payment(self):
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        self.fake.set_status(payment.session_reference, "success")
        response = self.client.get(reverse("senjaropay-return"), {"reference": payment.session_reference})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"booking_id": self.booking.id, "payment_id": payment.id, "kind": "deposit", "status": "completed"},
        )

    def test_return_with_senjaropays_own_id_finds_the_latest_checkout(self):
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        self.fake.set_status(payment.session_reference, "success")
        response = self.client.get(reverse("senjaropay-return"), {"reference": "3be4f834-7b5b-4fae-8a94-59b9e330ca2b"})
        self.assertEqual(response.data["payment_id"], payment.id)
        self.assertEqual(response.data["status"], "completed")

    def test_return_page_hides_other_tourists_payments(self):
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.client.post(reverse("login"), {"email": "other@example.com", "password": "pw12345"})
        response = self.client.get(reverse("senjaropay-return"), {"reference": payment.session_reference})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @override_settings(FRONTEND_URL="https://pande.example")
    def test_returns_on_the_api_host_go_to_the_website(self):
        for outcome in ("success", "fail", "cancel"):
            response = self.client.get(f"/{outcome}?order_id=CARD-1")
            self.assertEqual(response.status_code, 302)
            self.assertEqual(response["Location"], f"https://pande.example/{outcome}?order_id=CARD-1")

    def test_cancel_return_closes_a_pending_payment_but_never_completes_one(self):
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        response = self.client.get(
            reverse("senjaropay-return"), {"reference": payment.session_reference, "outcome": "cancel"}
        )
        self.assertEqual(response.data["status"], "failed")
        # Paid after all (or the URL lied): the next check still completes it.
        self.fake.set_status(payment.session_reference, "success")
        self.assertEqual(self.status_of(payment.id).data["status"], "completed")

    def test_success_return_does_not_close_a_pending_payment(self):
        payment = Payment.objects.get(pk=self.pay().data["payment_id"])
        response = self.client.get(
            reverse("senjaropay-return"), {"reference": payment.session_reference, "outcome": "success"}
        )
        self.assertEqual(response.data["status"], "pending")

    def test_paid_amount_reads_numbers_and_objects(self):
        self.assertEqual(senjaropay.paid_amount({"amount": "30.00"}, "USD"), (30, "USD"))
        self.assertEqual(senjaropay.paid_amount({"amount": {"value": 30, "currency": "USD"}}, "TZS"), (30, "USD"))
