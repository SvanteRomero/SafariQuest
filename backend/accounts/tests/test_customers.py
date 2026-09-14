from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Invoice
from safaris.models import SafariPackage

User = get_user_model()


class CustomerDirectoryTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("customer-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(
            email="mark@example.com", password="pw12345", role="tourist", name="Mark Thompson"
        )
        self.safari = SafariPackage.objects.create(
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

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list(self):
        self._login_as(self.tourist)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lists_only_tourists(self):
        self._login_as(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated (config.pagination.StandardPagination): count + results.
        emails = {row["email"] for row in response.data["results"]}
        self.assertEqual(emails, {"mark@example.com"})
        self.assertEqual(response.data["count"], 1)

    def test_detail_includes_bookings_and_invoices(self):
        booking = Booking.objects.create(
            customer=self.tourist, safari=self.safari, stage=Booking.STAGE_QUOTED,
            start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=2,
        )
        invoice = Invoice.objects.create(
            booking=booking, amount=5000, due_date=timezone.localdate() + timedelta(days=14)
        )
        self._login_as(self.admin)
        response = self.client.get(reverse("customer-detail", args=[self.tourist.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["bookings"]), 1)
        self.assertEqual(len(response.data["invoices"]), 1)
        self.assertEqual(response.data["invoices"][0]["id"], invoice.id)
        self.assertEqual(response.data["invoices"][0]["amount"], 5000)

    def test_detail_invoices_empty_when_booking_not_yet_quoted(self):
        Booking.objects.create(
            customer=self.tourist, safari=self.safari, stage=Booking.STAGE_NEW_INQUIRY,
            start_date=date(2026, 9, 1), end_date=date(2026, 9, 7), guests=2,
        )
        self._login_as(self.admin)
        response = self.client.get(reverse("customer-detail", args=[self.tourist.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["invoices"], [])
