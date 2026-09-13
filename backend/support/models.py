from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    """A guide- or tourist-filed issue (3.5 / 4.4), resolved from the Admin Complaints Inbox (7.2)."""

    STATUS_OPEN = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_RESOLVED = "resolved"

    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_RESOLVED, "Resolved"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="support_tickets", on_delete=models.CASCADE
    )
    booking = models.ForeignKey(
        "bookings.Booking", related_name="support_tickets", null=True, blank=True, on_delete=models.SET_NULL
    )
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    photo = models.URLField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ticket #{self.pk} — {self.reporter.email}"


class SupportTicketNote(models.Model):
    ticket = models.ForeignKey(SupportTicket, related_name="notes", on_delete=models.CASCADE)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="support_ticket_notes", null=True, on_delete=models.SET_NULL
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Note on ticket #{self.ticket_id}"
