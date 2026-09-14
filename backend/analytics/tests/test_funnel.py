from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from analytics.models import FunnelEvent
from bookings.models import Booking
from destinations.models import Destination
from region_safaris.models import RegionSafari
from safaris.models import SafariPackage

User = get_user_model()


class FunnelEventCreateTests(APITestCase):
    def setUp(self):
        self.url = reverse("funnel-event-create")

    def test_anonymous_can_record_an_event(self):
        response = self.client.post(self.url, {"step": "visited", "session_id": "abc123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FunnelEvent.objects.count(), 1)

    def test_rejects_unknown_step(self):
        response = self.client.post(self.url, {"step": "bogus", "session_id": "abc123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FunnelSummaryTests(APITestCase):
    def setUp(self):
        self.url = reverse("funnel-summary")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

        FunnelEvent.objects.create(step=FunnelEvent.STEP_VISITED, session_id="s1")
        FunnelEvent.objects.create(step=FunnelEvent.STEP_VISITED, session_id="s2")
        FunnelEvent.objects.create(step=FunnelEvent.STEP_VISITED, session_id="s1")  # duplicate session
        FunnelEvent.objects.create(step=FunnelEvent.STEP_STARTED, session_id="s1")
        FunnelEvent.objects.create(step=FunnelEvent.STEP_SUBMITTED, session_id="s1")

        region = Destination.objects.create(
            slug="serengeti", name="Serengeti", image_alt="x", badge="", best_time_to_visit="June",
            highlight="x", link_label="x", about="x", wildlife="x", getting_there="x",
        )
        region_safari = RegionSafari.objects.create(
            slug="mini-serengeti", region=region, title="Mini Serengeti", image="https://example.com/i.jpg",
            image_alt="x", rating="4.5", days=3, accommodation="Camp", price=1000, overview="x",
        )
        Booking.objects.create(
            customer=self.tourist, region_safari=region_safari, stage=Booking.STAGE_CONFIRMED,
            start_date=date(2026, 9, 1), end_date=date(2026, 9, 3), guests=2,
        )
        # A multi-region SafariPackage booking, confirmed like the one above.
        # The original implementation filtered on region_safari__isnull=False,
        # which silently excluded every booking like this one from "confirmed"
        # — the admin-facing conversion metric undercounted for the more
        # common of the two product types.
        safari = SafariPackage.objects.create(
            slug="migration-quest", title="7-Day Great Migration Quest", image="https://example.com/i.jpg",
            image_alt="x", rating="4.9", days=7, accommodation="Camp", price=17000,
            destination="Serengeti National Park", overview="x",
        )
        Booking.objects.create(
            customer=self.tourist, safari=safari, stage=Booking.STAGE_CONFIRMED,
            start_date=date(2026, 9, 10), end_date=date(2026, 9, 17), guests=2,
        )

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_non_admin_forbidden(self):
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_counts_are_unique_sessions_and_real_confirmed_bookings(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["visited"], 2)
        self.assertEqual(response.data["started"], 1)
        self.assertEqual(response.data["submitted"], 1)
        self.assertEqual(response.data["confirmed"], 2)  # one region_safari + one safari booking
