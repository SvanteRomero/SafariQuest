from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from audit.utils import log_action

User = get_user_model()


class AuditLogListTests(APITestCase):
    def setUp(self):
        self.url = reverse("audit-log-list")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        log_action(self.admin, "user.invited", "Invited someone@example.com as Administrator")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list(self):
        self._login_as(self.tourist)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lists_entries_newest_first(self):
        log_action(None, "booking.stage_changed", "Booking #1 moved from new_inquiry to quoted")
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated (config.pagination.StandardPagination): count + results,
        # not a bare array. Was `[:200]`, a hand-rolled unpaginated cap.
        self.assertEqual(response.data["count"], 2)
        results = response.data["results"]
        self.assertEqual(results[0]["action"], "booking.stage_changed")
        self.assertEqual(results[0]["actor_name"], "System")
        self.assertEqual(results[1]["action"], "user.invited")
        self.assertIn("admin@example.com", results[1]["actor_name"])

    def test_list_is_paginated(self):
        for i in range(30):
            log_action(None, "booking.stage_changed", f"Entry {i}")
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 31)
        self.assertEqual(len(response.data["results"]), 25)  # StandardPagination.page_size
        self.assertIsNotNone(response.data["next"])

        second_page = self.client.get(response.data["next"])
        self.assertEqual(second_page.status_code, status.HTTP_200_OK)
        self.assertEqual(len(second_page.data["results"]), 6)
        self.assertIsNone(second_page.data["next"])
