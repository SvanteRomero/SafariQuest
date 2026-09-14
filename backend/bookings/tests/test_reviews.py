from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Review
from guides.models import Guide
from safaris.models import SafariPackage

User = get_user_model()


class ReviewTests(APITestCase):
    def setUp(self):
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
        self.customer = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.other_tourist = User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.guide_user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide")
        self.guide = Guide.objects.create(name="Juma", role="Senior Guide", user=self.guide_user, rating=0)

        self.booking = Booking.objects.create(
            customer=self.customer,
            safari=self.safari,
            assigned_guide=self.guide,
            stage=Booking.STAGE_COMPLETED,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 7),
            guests=2,
        )
        self.url = reverse("booking-review", args=[self.booking.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_tourist_can_review_completed_trip(self):
        self._login_as(self.customer)
        response = self.client.post(self.url, {"guide_rating": 5, "trip_rating": 4, "testimonial": "Amazing!"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Review.objects.filter(booking=self.booking).exists())
        self.guide.refresh_from_db()
        self.assertEqual(float(self.guide.rating), 5.0)

    def test_cannot_review_a_non_completed_trip(self):
        self.booking.stage = Booking.STAGE_CONFIRMED
        self.booking.save(update_fields=["stage"])
        self._login_as(self.customer)
        response = self.client.post(self.url, {"guide_rating": 5, "trip_rating": 5})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_review_twice(self):
        self._login_as(self.customer)
        self.client.post(self.url, {"guide_rating": 5, "trip_rating": 5})
        response = self.client.post(self.url, {"guide_rating": 3, "trip_rating": 3})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_tourist_cannot_review_someone_elses_booking(self):
        self._login_as(self.other_tourist)
        response = self.client.post(self.url, {"guide_rating": 5, "trip_rating": 5})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_guide_average_recomputed_across_multiple_reviews(self):
        second_booking = Booking.objects.create(
            customer=self.other_tourist,
            safari=self.safari,
            assigned_guide=self.guide,
            stage=Booking.STAGE_COMPLETED,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 7),
            guests=1,
        )
        self._login_as(self.customer)
        self.client.post(self.url, {"guide_rating": 5, "trip_rating": 5})
        self._login_as(self.other_tourist)
        self.client.post(reverse("booking-review", args=[second_booking.id]), {"guide_rating": 3, "trip_rating": 4})
        self.guide.refresh_from_db()
        self.assertEqual(float(self.guide.rating), 4.0)

    def test_guide_reviews_endpoint_returns_summary_and_list(self):
        self._login_as(self.customer)
        self.client.post(self.url, {"guide_rating": 5, "trip_rating": 4, "testimonial": "Great trip"})
        self._login_as(self.guide_user)
        response = self.client.get(reverse("guide-reviews"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["average"], 5.0)
        self.assertEqual(response.data["reviews"][0]["testimonial"], "Great trip")
