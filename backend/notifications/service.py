"""Sending portal notifications: `notify(...)` from anywhere that used to send an email."""

import logging

from django.contrib.auth import get_user_model

from .models import Notification

logger = logging.getLogger(__name__)


def notify(recipients, title, body="", link=""):
    """Puts a notification in each recipient's portal. `recipients` is a user or an
    iterable of users. Best-effort, like the emails it replaces: a failure is logged and
    never fails the request that triggered it (the booking or payment has already been
    saved by then)."""
    user_model = get_user_model()
    users = [recipients] if isinstance(recipients, user_model) else list(recipients)
    try:
        Notification.objects.bulk_create(
            Notification(user=user, title=title[:200], body=body, link=link[:300]) for user in users
        )
    except Exception:
        logger.exception("Could not create notification %r for %s", title, [u.pk for u in users])


def notify_admins(title, body="", link=""):
    """Every active administrator."""
    user_model = get_user_model()
    notify(user_model.objects.filter(role=user_model.ROLE_ADMIN, is_active=True), title, body, link)
