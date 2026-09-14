import logging

from django.core.mail import send_mail as django_send_mail

logger = logging.getLogger(__name__)


def send_notification(subject, message, recipient_list):
    """Send a transactional email, logging rather than raising on failure.

    Every caller here mutates state before sending: a booking stage moves to
    QUOTED and an invoice is issued, an account is created, a password-set token
    is minted. Letting an SMTP error propagate would return a 500 *after* those
    writes have already committed — the admin sees a failure for work that
    actually succeeded, and clicks the button again.

    The broad except is deliberate: delivery is best-effort and must never be
    able to fail the surrounding request. It is logged at error level with a
    traceback so a misconfigured mail host is visible rather than silent, which
    was the original defect this whole change is fixing.

    Returns True when the backend accepted the message.
    """
    try:
        accepted = django_send_mail(
            subject=subject,
            message=message,
            from_email=None,  # falls back to DEFAULT_FROM_EMAIL
            recipient_list=recipient_list,
        )
    except Exception:
        logger.exception("Email %r to %s failed to send", subject, recipient_list)
        return False
    if not accepted:
        logger.error("Email %r to %s was not delivered", subject, recipient_list)
        return False
    return True
