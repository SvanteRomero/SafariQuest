"""Snippe payments for bookings: opening a checkout session, and applying one once
Snippe confirms it was paid.

The pay endpoints (BookingViewSet.pay / pay_balance) only open a session; nothing about
the booking changes until complete_payment runs, from the signed webhook
(SnippeWebhookView) or a status check against Snippe's own API (payment_status). Both
can fire for the same session, and Snippe retries webhooks, so complete_payment is
idempotent: it locks the Payment row and does nothing for one that's already final.
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from audit.utils import log_action
from notifications.service import notify, notify_admins
from referrals.models import ReferralCode, ReferralRedemption

from . import senjaropay, snippe
from .currency import PROVIDER_LABELS, PROVIDER_SENJAROPAY
from .models import Booking, Invoice, Payment
from .outages import record_attempt

logger = logging.getLogger(__name__)

INVOICE_DUE_DAYS = 14
# The balance left after a checkout deposit is due this long before the trip starts.
BALANCE_DUE_DAYS_BEFORE_TRIP = 30
SUPPORTED_LOCALES = {"en", "fr", "de", "pt"}
# Senjaropay's card page expires after about 30 minutes; a payment still pending well
# past that is treated as abandoned.
CARD_CHECKOUT_STALE_AFTER = timedelta(hours=2)


def balance_due_date(booking):
    """When the rest of a checkout booking's price falls due: BALANCE_DUE_DAYS_BEFORE_TRIP
    ahead of the start, but never sooner than INVOICE_DUE_DAYS from today (a last-minute
    booking still gets the usual time to pay) and never after the trip has started.

    This used to be the payment date itself, which made every deposit invoice "overdue"
    the next morning — on the tourist's own invoice list and in the finance summary.
    """
    due = max(
        booking.start_date - timedelta(days=BALANCE_DUE_DAYS_BEFORE_TRIP),
        timezone.localdate() + timedelta(days=INVOICE_DUE_DAYS),
    )
    return min(due, booking.start_date)


def _return_url(payment, locale):
    locale = locale if locale in SUPPORTED_LOCALES else "en"
    base = settings.FRONTEND_URL.rstrip("/")
    if payment.kind == Payment.KIND_DEPOSIT:
        return f"{base}/{locale}/booking-confirmed?booking={payment.booking_id}&payment={payment.id}"
    return f"{base}/{locale}/account?booking={payment.booking_id}&payment={payment.id}"


def open_session(payment, locale):
    """Creates the Snippe checkout session for a pending Payment and stores its reference
    and URL. Raises snippe.SnippeError (after marking the payment failed) if Snippe
    refuses or can't be reached."""
    booking = payment.booking
    label = "deposit" if payment.kind == Payment.KIND_DEPOSIT else "remaining balance"
    try:
        session = snippe.create_session(
            amount=payment.amount,
            description=f"{booking.package_title} — {label} (booking #{booking.id})",
            # Snippe metadata values must be strings, numbers or booleans.
            metadata={"booking_id": booking.id, "payment_id": payment.id, "kind": payment.kind},
            customer={"name": booking.customer.name, "email": booking.customer.email},
            redirect_url=_return_url(payment, locale),
            idempotency_key=f"safariquest-payment-{payment.id}",
        )
    except snippe.SnippeError:
        payment.status = Payment.STATUS_FAILED
        payment.save(update_fields=["status"])
        raise
    payment.session_reference = session["reference"]
    payment.checkout_url = session["checkout_url"]
    payment.save(update_fields=["session_reference", "checkout_url"])
    return payment


def _customer_names(user):
    """Snippe requires a first and last name for direct payments. An account may only
    have one name (or none, with an email), so fall back sensibly rather than fail."""
    parts = (user.name or "").split()
    if not parts:
        parts = [user.email.split("@")[0]]
    return parts[0], " ".join(parts[1:]) or parts[0]


def open_direct_payment(payment):
    """Sends the payment prompt to the pending Payment's phone number and stores Snippe's
    reference. Raises snippe.SnippeError (after marking the payment failed) if Snippe
    refuses or can't be reached."""
    booking = payment.booking
    firstname, lastname = _customer_names(booking.customer)
    try:
        data = snippe.create_mobile_payment(
            amount=payment.amount,
            phone_number=payment.phone_number,
            customer={"firstname": firstname, "lastname": lastname, "email": booking.customer.email},
            # Snippe metadata values must be strings, numbers or booleans.
            metadata={"booking_id": booking.id, "payment_id": payment.id, "kind": payment.kind},
            # Within Snippe's 30-character limit for any realistic id.
            idempotency_key=f"sq-payment-{payment.id}",
        )
    except snippe.SnippeError:
        payment.status = Payment.STATUS_FAILED
        payment.save(update_fields=["status"])
        raise
    payment.session_reference = data["reference"]
    payment.save(update_fields=["session_reference"])
    return payment


def open_card_payment(payment, billing):
    """Opens Senjaropay's hosted card page for a pending USD Payment and stores its
    reference and URL. `billing` is the phone_number, country, city and address the
    tourist entered — Senjaropay requires them. Raises senjaropay.SenjaropayError (after
    marking the payment failed) if Senjaropay refuses or can't be reached."""
    customer = payment.booking.customer
    firstname, lastname = _customer_names(customer)
    try:
        data = senjaropay.create_card_payment(
            amount=payment.amount,
            currency=payment.currency,
            customer={"firstname": firstname, "lastname": lastname, "email": customer.email, **billing},
        )
    except senjaropay.SenjaropayError:
        payment.status = Payment.STATUS_FAILED
        payment.save(update_fields=["status"])
        raise
    payment.session_reference = data["reference"]
    payment.checkout_url = data["checkout_url"]
    payment.save(update_fields=["session_reference", "checkout_url"])
    return payment


def resend_prompt(payment):
    """Asks Snippe to send a still-pending direct payment's prompt to the phone again."""
    return snippe.push_payment(payment.session_reference)


def close_payment(payment, status):
    """Marks a still-pending payment failed or expired. A final one is left alone."""
    with transaction.atomic():
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != Payment.STATUS_PENDING:
            return payment
        payment.status = status
        payment.save(update_fields=["status"])
    return payment


def _provider_label(payment):
    return PROVIDER_LABELS.get(payment.provider, payment.provider)


def complete_payment(payment, *, amount, currency, provider_reference=""):
    """Applies a payment Snippe has confirmed: the deposit creates the invoice (and redeems
    the referral code), the balance settles it. `amount`/`currency` are what Snippe says
    was paid; a mismatch with what this session was opened for is recorded rather than
    applied. Returns the up-to-date Payment."""
    notifications = []
    with transaction.atomic():
        payment = Payment.objects.select_for_update().select_related("booking").get(pk=payment.pk)
        if payment.status == Payment.STATUS_COMPLETED:
            return payment
        payment.status = Payment.STATUS_COMPLETED
        payment.completed_at = timezone.now()
        payment.provider_reference = provider_reference or payment.provider_reference
        if amount != payment.amount or (currency or "").upper() != payment.currency:
            payment.needs_attention = (
                f"{_provider_label(payment)} reported {currency} {amount}, but this session was "
                f"opened for {payment.currency} {payment.amount}. Not applied to the booking."
            )
        elif payment.kind == Payment.KIND_DEPOSIT:
            notifications = _apply_deposit(payment)
        else:
            notifications = _apply_balance(payment)
        payment.save()

    if payment.needs_attention:
        logger.error("%s payment %s needs attention: %s", _provider_label(payment), payment.id, payment.needs_attention)
        log_action(
            payment.booking.customer,
            "booking.payment_needs_attention",
            f"Payment #{payment.id} for booking #{payment.booking_id}: {payment.needs_attention}",
        )
        notify_admins(
            f"Payment needs attention — booking #{payment.booking_id}",
            payment.needs_attention,
            link=_admin_link(payment.booking_id),
        )
    for announce in notifications:
        announce()
    return payment


def _admin_link(booking_id):
    return f"/admin/inquiries/{booking_id}"


def _customer_link(booking_id):
    return f"/account/trips/{booking_id}"


def _record_deposit_invoice(booking, payment):
    """The invoice now recording this deposit, or None if a deposit already was. A
    checkout booking gets a new one. A quoted booking's deposit lands on the invoice
    send_quote issued (the quoted total, nothing paid yet), which from here reads like a
    checkout invoice: paid so far, out of trip_total."""
    invoice = Invoice.objects.select_for_update().filter(booking=booking).first()
    if invoice is None:
        return Invoice.objects.create(
            booking=booking,
            amount=payment.amount,
            trip_total=payment.trip_total,
            status=Invoice.STATUS_DEPOSIT_PAID,
            due_date=balance_due_date(booking),
        )
    if invoice.status != Invoice.STATUS_UNPAID or invoice.trip_total is not None:
        return None
    invoice.amount = payment.amount
    invoice.trip_total = payment.trip_total
    invoice.status = Invoice.STATUS_DEPOSIT_PAID
    invoice.due_date = balance_due_date(booking)
    invoice.save(update_fields=["amount", "trip_total", "status", "due_date"])
    return invoice


def _apply_deposit(payment):
    booking = Booking.objects.select_for_update().select_related("customer").get(pk=payment.booking_id)
    invoice = _record_deposit_invoice(booking, payment)
    if invoice is None:
        # Two deposit sessions were opened and both got paid. The first one stands.
        payment.needs_attention = (
            "A deposit for this booking was already recorded; this second deposit was paid "
            f"but not applied. Refund it through {_provider_label(payment)}."
        )
        return []
    if booking.stage in (Booking.STAGE_NEW_INQUIRY, Booking.STAGE_QUOTED):
        booking.stage = Booking.STAGE_DEPOSIT_PAID
        booking.save(update_fields=["stage"])

    redemption = None
    if payment.referral_code_id:
        # Checked again here, locked: the code was free when the session opened, but
        # another booking may have used it while this tourist was on Snippe's page. The
        # tourist still keeps the discount they paid with; only the commission is lost.
        code = (
            ReferralCode.objects.select_for_update()
            .filter(pk=payment.referral_code_id, is_used=False)
            .select_related("agent")
            .first()
        )
        if code is None:
            payment.needs_attention = (
                "The referral code applied at checkout was used by another booking before this "
                "payment completed, so no commission was recorded."
            )
        else:
            commission_amount = round(payment.trip_total * payment.commission_percent / 100)
            redemption = ReferralRedemption.objects.create(
                code=code,
                booking=booking,
                discount_percent=payment.discount_percent,
                commission_percent=payment.commission_percent,
                trip_total=payment.trip_total,
                commission_amount=commission_amount,
            )
            code.is_used = True
            code.used_at = timezone.now()
            code.save(update_fields=["is_used", "used_at"])

    customer = booking.customer

    def notify_customer():
        notify(
            customer,
            f"Payment received — {booking.package_title}",
            f"We've received your deposit of {payment.currency} {payment.amount:,}. Thank you for "
            "booking with Pande Wilderness Safari!",
            link=_customer_link(booking.id),
        )
        notify_admins(
            f"Deposit paid — {booking.package_title}",
            f"{customer.name or customer.email} paid a {payment.currency} {payment.amount:,} deposit "
            f"via {_provider_label(payment)} (booking #{booking.id}).",
            link=_admin_link(booking.id),
        )
        log_action(
            customer,
            "booking.payment_recorded",
            f"Deposit of {payment.currency} {payment.amount:,} paid via {_provider_label(payment)} for booking "
            f"#{booking.id} (invoice #{invoice.id}, payment #{payment.id})",
        )

    def notify_agent():
        agent = redemption.code.agent
        notify(
            agent,
            "Your referral code was used!",
            f"Code {redemption.code.code} was just used for a new booking. You've earned an estimated "
            f"{payment.currency} {redemption.commission_amount:,} commission, paid once the customer's "
            "trip is completed.",
            link="/account/agent",
        )
        log_action(
            customer,
            "referral.code_redeemed",
            f"Referral code {redemption.code.code} redeemed on booking #{booking.id} "
            f"(commission {payment.currency} {redemption.commission_amount:,} owed to {agent.email})",
        )

    return [notify_customer] + ([notify_agent] if redemption else [])


def _apply_balance(payment):
    booking = Booking.objects.select_for_update().select_related("customer").get(pk=payment.booking_id)
    invoice = Invoice.objects.select_for_update().filter(booking=booking).first()
    if not invoice or invoice.trip_total is None or not invoice.remaining_balance:
        payment.needs_attention = (
            "This booking had no balance left when the payment completed; it was paid but not "
            f"applied. Refund it through {_provider_label(payment)}."
        )
        return []
    invoice.amount = min(invoice.amount + payment.amount, invoice.trip_total)
    if invoice.amount >= invoice.trip_total:
        invoice.status = Invoice.STATUS_PAID
    invoice.save(update_fields=["amount", "status"])
    # Only a deposit-paid booking moves on. An admin may already have advanced it (to
    # confirmed, or completed after the trip), and paying the balance late must not move
    # it backwards.
    if invoice.status == Invoice.STATUS_PAID and booking.stage == Booking.STAGE_DEPOSIT_PAID:
        booking.stage = Booking.STAGE_CONFIRMED
        booking.save(update_fields=["stage"])

    customer = booking.customer

    def notify_customer():
        notify(
            customer,
            f"Balance paid — {booking.package_title}",
            f"We've received your remaining balance of {payment.currency} {payment.amount:,}. "
            "Your trip is now fully paid.",
            link=_customer_link(booking.id),
        )
        notify_admins(
            f"Balance paid — {booking.package_title}",
            f"{customer.name or customer.email} paid the remaining {payment.currency} {payment.amount:,} "
            f"via {_provider_label(payment)} (booking #{booking.id}).",
            link=_admin_link(booking.id),
        )
        log_action(
            customer,
            "booking.balance_paid",
            f"Remaining balance of {payment.currency} {payment.amount:,} paid via {_provider_label(payment)} for "
            f"booking #{booking.id} (invoice #{invoice.id}, payment #{payment.id})",
        )

    return [notify_customer]


def reconcile_open_payments(limit=50):
    """Asks the provider (Snippe, or Senjaropay for USD cards) about every payment still
    open (pending, or failed but possibly retried on the same session) and applies what it
    says — so a payment is confirmed even when the webhook never arrives and the tourist
    closed the tab before the page could check. Run on a schedule by
    `manage.py reconcile_snippe_payments`.

    Only sessions young enough to still change are checked: Snippe expires a session after
    SNIPPE_SESSION_EXPIRES_IN, and a day on top covers a payment completed right at the end.
    `limit` keeps one run well inside Snippe's 60-requests-a-minute rate limit. Returns
    {"checked", "completed", "closed"} counts."""
    since = timezone.now() - timedelta(seconds=settings.SNIPPE_SESSION_EXPIRES_IN) - timedelta(days=1)
    open_payments = (
        Payment.objects.filter(
            status__in=(Payment.STATUS_PENDING, Payment.STATUS_FAILED),
            created_at__gte=since,
        )
        .exclude(session_reference=None)
        .exclude(session_reference="")
        .order_by("created_at")[:limit]
    )
    counts = {"checked": 0, "completed": 0, "closed": 0}
    for payment in open_payments:
        before = payment.status
        payment = refresh_payment(payment)
        counts["checked"] += 1
        if payment.status == Payment.STATUS_COMPLETED:
            counts["completed"] += 1
            logger.warning("Payment %s confirmed by the scheduled check, not a webhook", payment.id)
        elif payment.status != before:
            counts["closed"] += 1
    return counts


def _refresh_direct(payment):
    """A direct payment's status straight from Snippe. Unlike a session, a failed direct
    payment is final — retrying means a new payment — so only pending ones are checked.
    The result also feeds outage detection, as a webhook would, in case none arrives."""
    if payment.status != Payment.STATUS_PENDING:
        return payment
    try:
        data = snippe.get_payment(payment.session_reference)
    except snippe.SnippeError:
        logger.warning("Could not check Snippe payment %s", payment.session_reference, exc_info=True)
        return payment
    snippe_status = data.get("status")
    if snippe_status not in ("completed", "failed", "voided", "expired"):
        return payment
    # A direct payment is a single attempt: record it here only if its webhook didn't.
    if snippe_status in ("completed", "failed") and not payment.attempts.exists():
        record_attempt(
            event_id=f"poll:{payment.session_reference}",
            payment=payment,
            data=data,
            succeeded=snippe_status == "completed",
        )
    if snippe_status == "completed":
        amount = data.get("amount") or {}
        return complete_payment(payment, amount=amount.get("value"), currency=amount.get("currency"))
    return close_payment(payment, Payment.STATUS_EXPIRED if snippe_status == "expired" else Payment.STATUS_FAILED)


def refresh_payment(payment):
    """Asks whichever provider took this payment how it stands, and applies the answer."""
    if payment.provider == PROVIDER_SENJAROPAY:
        return _refresh_card(payment)
    return refresh_from_snippe(payment)


def _refresh_card(payment):
    """A Senjaropay card payment's status from its own API. A declined card can be
    retried on the same hosted page, so a failed one is still checked (like a Snippe
    session). One still pending long after the page expired is closed as expired."""
    if not payment.session_reference or payment.status not in (Payment.STATUS_PENDING, Payment.STATUS_FAILED):
        return payment
    try:
        data = senjaropay.get_card_payment(payment.session_reference)
    except senjaropay.SenjaropayError:
        logger.warning("Could not check Senjaropay payment %s", payment.session_reference, exc_info=True)
        return payment
    card_status = str(data.get("status") or "").lower()
    if card_status in senjaropay.COMPLETED_STATUSES:
        amount, currency = senjaropay.paid_amount(data, payment.currency)
        return complete_payment(
            payment, amount=amount, currency=currency, provider_reference=data.get("transaction_id") or ""
        )
    if card_status in senjaropay.FAILED_STATUSES:
        return close_payment(payment, Payment.STATUS_FAILED)
    if card_status in senjaropay.EXPIRED_STATUSES or timezone.now() - payment.created_at > CARD_CHECKOUT_STALE_AFTER:
        return close_payment(payment, Payment.STATUS_EXPIRED)
    return payment


def refresh_from_snippe(payment):
    """For a still-pending payment, asks Snippe directly how it stands and applies the
    answer. Covers a webhook that's late, or that can't reach a local dev server.
    Errors talking to Snippe are logged and the payment is returned unchanged."""
    if not payment.session_reference:
        return payment
    if payment.mode == Payment.MODE_DIRECT:
        return _refresh_direct(payment)
    # A failed attempt leaves a hosted session open for the tourist to try again, so a
    # "failed" payment can still complete.
    if payment.status not in (Payment.STATUS_PENDING, Payment.STATUS_FAILED):
        return payment
    try:
        session = snippe.get_session(payment.session_reference)
    except snippe.SnippeError:
        logger.warning("Could not check Snippe session %s", payment.session_reference, exc_info=True)
        return payment
    session_status = session.get("status")
    if session_status == "completed":
        return complete_payment(
            payment,
            amount=session.get("amount"),
            currency=session.get("currency"),
        )
    if session_status in ("expired", "cancelled"):
        return close_payment(payment, Payment.STATUS_EXPIRED)
    return payment
