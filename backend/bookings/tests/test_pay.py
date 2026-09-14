from datetime import date

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Invoice
from safaris.models import SafariPackage

User = get_user_model()


def make_booking(customer, stage=Booking.STAGE_NEW_INQUIRY):
    safari = SafariPackage.objects.create(
        slug="migration-quest",
        title="7-Day Great Migration Quest",
        image="https://example.com/image.jpg",
        image_alt="Migration",
        rating="4.9",
        days=7,
        accommodation="Luxury tented camp",
        price=17000,
        destination="Serengeti National Park",
        overview="A migration safari.",
    )
    return Booking.objects.create(
        customer=customer, safari=safari, stage=stage,
        start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=4,
    )


class BookingPayTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.other_tourist = User.objects.create_user(
            email="other@example.com", password="pw12345", role="tourist"
        )
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.booking = make_booking(self.customer)
        self.pay_url = reverse("booking-pay", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_pay(self):
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_other_tourist_cannot_pay_someone_elses_booking(self):
        self._login_as(self.other_tourist)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_pay_and_stage_advances(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stage"], "deposit_paid")
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)

    def test_owner_can_pay_creates_invoice_marked_deposit_paid(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url, {"amount": 5100})
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual(invoice.amount, 5100)
        self.assertEqual(invoice.status, Invoice.STATUS_DEPOSIT_PAID)

    def test_owner_can_pay_sends_confirmation_email_to_their_own_address(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["mark@example.com"])

    def test_cannot_pay_twice(self):
        self._login_as(self.customer)
        self.client.post(self.pay_url, {"amount": 5100})
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Invoice.objects.filter(booking=self.booking).count(), 1)

    def test_rejects_missing_amount(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_zero_amount(self):
        self._login_as(self.customer)
        response = self.client.post(self.pay_url, {"amount": 0})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_pay_on_behalf_of_a_tourist(self):
        self._login_as(self.admin)
        response = self.client.post(self.pay_url, {"amount": 5100})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class InvoiceMineTests(APITestCase):
    def setUp(self):
        self.mine_url = reverse("invoice-mine")
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.other_tourist = User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.mine_booking = make_booking(self.customer)
        self.other_booking = make_booking(self.other_tourist)
        Invoice.objects.create(
            booking=self.mine_booking, amount=5100, status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 9, 1)
        )
        Invoice.objects.create(
            booking=self.other_booking, amount=9600, status=Invoice.STATUS_DEPOSIT_PAID, due_date=date(2026, 9, 1)
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.mine_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tourist_sees_only_their_own_invoices(self):
        self._login_as(self.customer)
        response = self.client.get(self.mine_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["amount"], 5100)
