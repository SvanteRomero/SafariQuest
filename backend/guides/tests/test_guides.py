from datetime import date

from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class GuideAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("guide-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.payload = {
            "name": "Juma Mdoe",
            "role": "Senior Guide",
            "status": "Available",
            "rating": "4.9",
        }

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list_guides(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_create_guide(self):
        self._login_as(self.tourist)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_register_guide(self):
        self._login_as(self.admin)
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Juma Mdoe")
        self.assertEqual(response.data["status"], "Available")

    def test_invalid_role_choice_rejected(self):
        self._login_as(self.admin)
        bad_payload = dict(self.payload, role="Not A Real Role")
        response = self.client.post(self.list_url, bad_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GuideCreateWithAccountTests(APITestCase):
    def setUp(self):
        self.url = reverse("guide-create-with-account")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_non_admin_cannot_create(self):
        self._login_as(self.tourist)
        response = self.client.post(
            self.url, {"name": "Amina Hassan", "email": "amina@example.com", "role": "Driver-Guide"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_creates_login_and_guide_profile_together(self):
        from guides.models import Guide

        self._login_as(self.admin)
        response = self.client.post(
            self.url, {"name": "Amina Hassan", "email": "amina@example.com", "role": "Driver-Guide"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "amina@example.com")
        self.assertTrue(response.data["temporary_password"])

        user = User.objects.get(email="amina@example.com")
        self.assertEqual(user.role, "guide")
        self.assertTrue(user.check_password(response.data["temporary_password"]))

        guide = Guide.objects.get(user=user)
        self.assertEqual(guide.name, "Amina Hassan")
        self.assertEqual(guide.role, "Driver-Guide")

    def test_duplicate_email_rejected(self):
        self._login_as(self.admin)
        self.client.post(self.url, {"name": "A", "email": "dup@example.com", "role": "Driver-Guide"})
        response = self.client.post(self.url, {"name": "B", "email": "dup@example.com", "role": "Driver-Guide"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GuideMeTests(APITestCase):
    def setUp(self):
        from guides.models import Guide

        self.url = reverse("guide-me")
        self.guide_user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide", name="Juma Mdoe")
        self.guide = Guide.objects.create(name="Juma Mdoe", role="Senior Guide", user=self.guide_user)
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_unlinked_account_gets_404(self):
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_linked_guide_can_view_own_profile(self):
        self._login_as(self.guide_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Juma Mdoe")

    def test_guide_can_update_name_and_status(self):
        self._login_as(self.guide_user)
        response = self.client.patch(self.url, {"name": "Juma M.", "status": "Off-Duty"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Juma M.")
        self.assertEqual(response.data["status"], "Off-Duty")

        self.guide.refresh_from_db()
        self.assertEqual(self.guide.name, "Juma M.")
        self.guide_user.refresh_from_db()
        self.assertEqual(self.guide_user.name, "Juma M.")

    def test_guide_cannot_change_role_via_me(self):
        self._login_as(self.guide_user)
        response = self.client.patch(self.url, {"role": "Expert Guide"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.guide.refresh_from_db()
        self.assertEqual(self.guide.role, "Senior Guide")

    def test_guide_can_update_bio_languages_specialties(self):
        self._login_as(self.guide_user)
        response = self.client.patch(
            self.url,
            {
                "bio": "10+ years leading safaris across the Serengeti ecosystem.",
                "languages": ["Swahili", "English"],
                "specialties": ["Big Cat Tracking"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.guide.refresh_from_db()
        self.assertEqual(self.guide.bio, "10+ years leading safaris across the Serengeti ecosystem.")
        self.assertEqual(self.guide.languages, ["Swahili", "English"])
        self.assertEqual(self.guide.specialties, ["Big Cat Tracking"])


class GuideCertificationTests(APITestCase):
    def setUp(self):
        from guides.models import Guide

        self.url = reverse("guide-certifications")
        self.guide_user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide", name="Juma Mdoe")
        self.guide = Guide.objects.create(name="Juma Mdoe", role="Senior Guide", user=self.guide_user)
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_unlinked_account_gets_404(self):
        self._login_as(self.tourist)
        response = self.client.post(self.url, {"title": "First Aid"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_guide_adds_certification(self):
        self._login_as(self.guide_user)
        response = self.client.post(
            self.url, {"title": "Wilderness First Responder", "valid_until": "2027-02-01"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["certifications"]), 1)
        self.assertEqual(response.data["certifications"][0]["title"], "Wilderness First Responder")
        self.guide.refresh_from_db()
        self.assertEqual(self.guide.certifications.count(), 1)


class GuideReviewsTests(APITestCase):
    """Covers /api/guides/me/reviews/ — previously untested, and the exact
    endpoint rewritten to replace 7 queries (5 per-star counts + an overall
    count + iterating the queryset again for the review list) with 2."""

    def setUp(self):
        from guides.models import Guide
        from bookings.models import Booking, Review
        from safaris.models import SafariPackage

        self.guide_user = User.objects.create_user(
            email="guide@example.com", password="pw12345", role="guide", name="Juma Mdoe"
        )
        self.guide = Guide.objects.create(
            name="Juma Mdoe", role="Senior Guide", user=self.guide_user, rating="4.5"
        )
        self.url = reverse("guide-reviews")

        safari = SafariPackage.objects.create(
            slug="migration-quest", title="7-Day Great Migration Quest", image="https://example.com/i.jpg",
            image_alt="x", rating="4.9", days=7, accommodation="Camp", price=17000,
            destination="Serengeti National Park", overview="x",
        )
        ratings = [5, 5, 4, 3, 1]
        for i, stars in enumerate(ratings):
            customer = User.objects.create_user(email=f"guest{i}@example.com", password="pw12345", role="tourist")
            booking = Booking.objects.create(
                customer=customer, safari=safari, assigned_guide=self.guide, stage=Booking.STAGE_COMPLETED,
                start_date=date(2026, 9, i + 1), end_date=date(2026, 9, i + 5), guests=2,
            )
            Review.objects.create(booking=booking, guide=self.guide, guide_rating=stars, trip_rating=stars)

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_distribution_and_count_are_correct(self):
        self._login_as(self.guide_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 5)
        by_stars = {row["stars"]: row["count"] for row in response.data["distribution"]}
        self.assertEqual(by_stars, {5: 2, 4: 1, 3: 1, 2: 0, 1: 1})
        self.assertEqual(len(response.data["reviews"]), 5)

    def test_query_count_does_not_scale_with_review_count(self):
        self._login_as(self.guide_user)
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Was 7+ (one .count() per star, one overall .count(), plus the
        # iteration below) and grew with unrelated factors; now fixed at a
        # small number regardless of how many reviews exist.
        self.assertLessEqual(len(ctx.captured_queries), 5, ctx.captured_queries)
