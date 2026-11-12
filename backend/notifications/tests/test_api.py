from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from notifications.service import notify, notify_admins

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.other = User.objects.create_user(email="other@example.com", password="pw12345", role="tourist")
        self.client.post(reverse("login"), {"email": self.user.email, "password": "pw12345"})

    def test_lists_only_my_notifications_newest_first_with_unread_count(self):
        notify(self.user, "First", link="/account")
        notify(self.user, "Second")
        notify(self.other, "Not mine")
        data = self.client.get(reverse("notification-list")).data
        self.assertEqual(data["unread"], 2)
        self.assertEqual([n["title"] for n in data["results"]], ["Second", "First"])

    def test_marks_one_or_all_read(self):
        notify(self.user, "One")
        notify(self.user, "Two")
        first = Notification.objects.get(title="One")
        self.client.post(reverse("notification-read"), {"id": first.id}, format="json")
        self.assertEqual(self.client.get(reverse("notification-list")).data["unread"], 1)
        self.client.post(reverse("notification-read"), {}, format="json")
        self.assertEqual(self.client.get(reverse("notification-list")).data["unread"], 0)

    def test_cannot_mark_someone_elses_notification(self):
        notify(self.other, "Theirs")
        theirs = Notification.objects.get(title="Theirs")
        self.client.post(reverse("notification-read"), {"id": theirs.id}, format="json")
        theirs.refresh_from_db()
        self.assertIsNone(theirs.read_at)

    def test_requires_sign_in(self):
        self.client.post(reverse("logout"))
        self.assertEqual(self.client.get(reverse("notification-list")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notify_admins_reaches_active_admins_only(self):
        User.objects.create_user(email="admin@example.com", password="pw", role="admin")
        User.objects.create_user(email="gone@example.com", password="pw", role="admin", is_active=False)
        notify_admins("Heads up")
        self.assertEqual(list(Notification.objects.values_list("user__email", flat=True)), ["admin@example.com"])
