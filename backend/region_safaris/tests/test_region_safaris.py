from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from destinations.models import Destination, Park

User = get_user_model()


class RegionSafariAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("region-safari-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.region = Destination.objects.create(
            slug="morogoro",
            name="Morogoro",
            image_alt="Morogoro hills",
            badge="Hidden Gem",
            best_time_to_visit="June - October",
            highlight="Uluguru Mountains",
            link_label="View Regional Tours",
            about="Morogoro region.",
            wildlife="Colobus monkeys.",
            getting_there="Bus from Dar es Salaam.",
        )
        self.other_region = Destination.objects.create(
            slug="arusha",
            name="Arusha",
            image_alt="Arusha city",
            badge="Safari Capital",
            best_time_to_visit="June - October",
            highlight="Cultural Markets",
            link_label="View Regional Tours",
            about="Arusha region.",
            wildlife="Giraffe.",
            getting_there="Kilimanjaro Airport.",
        )
        self.park = Park.objects.create(slug="uluguru-mountains", region=self.region, name="Uluguru Mountains")
        self.other_park = Park.objects.create(slug="arusha-np", region=self.other_region, name="Arusha National Park")
        self.payload = {
            "slug": "morogoro-hills-escape",
            "title": "Morogoro Hills Escape",
            "image": "https://example.com/morogoro.jpg",
            "image_alt": "Hills of Morogoro at sunrise.",
            "rating": "4.7",
            "days": 3,
            "accommodation": "Eco Lodge",
            "price": 650,
            "badge": "Weekend Getaway",
            "signature": False,
            "region": "morogoro",
            "parks": ["uluguru-mountains"],
            "overview": "A short escape into the Uluguru Mountains.",
            "highlights": ["Waterfall hikes"],
            "included": ["Local guide"],
            "excluded": ["Flights"],
            "itinerary": [
                {"day": 1, "title": "Arrival", "description": "Transfer to the lodge."},
                {"day": 2, "title": "Hike", "description": "Full-day mountain hike."},
            ],
        }

    def _login_as_admin(self):
        self.client.post(reverse("login"), {"email": self.admin.email, "password": "pw12345"})

    def test_anonymous_can_list_region_safaris(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_cannot_create_region_safari(self):
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_create_region_safari_with_itinerary(self):
        self._login_as_admin()
        response = self.client.post(self.list_url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["itinerary"]), 2)
        self.assertEqual(response.data["region"], "morogoro")

    def test_park_must_belong_to_region(self):
        self._login_as_admin()
        payload = dict(self.payload)
        payload["parks"] = ["arusha-np"]
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parks", response.data)

    def test_patch_without_itinerary_preserves_existing_children(self):
        self._login_as_admin()
        self.client.post(self.list_url, self.payload, format="json")
        detail_url = reverse("region-safari-detail", args=["morogoro-hills-escape"])
        response = self.client.patch(detail_url, {"badge": "Updated Badge"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["itinerary"]), 2)
        self.assertEqual(response.data["badge"], "Updated Badge")
