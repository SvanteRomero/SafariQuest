from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from audit.models import AuditLogEntry

User = get_user_model()


class UserDetailViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.second_admin = User.objects.create_user(
            email="admin2@example.com", password="pw12345", role="admin", name="Admin Two"
        )
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist")
        self.url = reverse("user-detail", args=[self.second_admin.id])

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_update(self):
        response = self.client.patch(self.url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_update(self):
        self._login_as(self.tourist)
        response = self.client.patch(self.url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_deactivates_another_admin(self):
        self._login_as(self.admin)
        response = self.client.patch(self.url, {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.second_admin.refresh_from_db()
        self.assertFalse(self.second_admin.is_active)
        self.assertTrue(AuditLogEntry.objects.filter(action="user.deactivated").exists())

    def test_admin_reactivates_another_admin(self):
        self.second_admin.is_active = False
        self.second_admin.save()
        self._login_as(self.admin)
        response = self.client.patch(self.url, {"is_active": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.second_admin.refresh_from_db()
        self.assertTrue(self.second_admin.is_active)
        self.assertTrue(AuditLogEntry.objects.filter(action="user.activated").exists())

    def test_admin_cannot_deactivate_self(self):
        self._login_as(self.admin)
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.id]), {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_cannot_target_a_tourist(self):
        self._login_as(self.admin)
        response = self.client.patch(
            reverse("user-detail", args=[self.tourist.id]), {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_inviting_a_user_writes_an_audit_entry(self):
        self._login_as(self.admin)
        self.client.post(reverse("invite-user"), {"email": "new@example.com", "name": "New"})
        self.assertTrue(AuditLogEntry.objects.filter(action="user.invited").exists())
