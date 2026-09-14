from django.conf import settings
from django.db import models


class AuditLogEntry(models.Model):
    """A record of a state-changing action taken by an authenticated user (9.2). Not every
    endpoint writes one yet — see the Ops Manual for which actions are currently covered."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="audit_log_entries", null=True, on_delete=models.SET_NULL
    )
    action = models.CharField(max_length=100)
    description = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action}: {self.description}"
