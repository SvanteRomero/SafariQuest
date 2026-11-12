from django.conf import settings
from django.db import models


class Notification(models.Model):
    """A message shown in the recipient's portal (the bell in the header) — how the system
    tells customers, agents, guides and admins about their bookings and payments. Email is
    kept only for account access (invites and set-password links)."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    # A site path to open, e.g. "/account/trips/12" or "/admin/inquiries/12" — without a
    # language prefix; the website adds the reader's own.
    link = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "read_at"])]

    def __str__(self):
        return f"{self.title} → {self.user}"
