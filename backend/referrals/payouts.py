"""Paying referral agents their commission.

Money leaves Pande outside this system (mobile money, a bank transfer, cash); what's
recorded here is that it happened — when, how, with what reference and by which admin —
and the agent is emailed. Commission only becomes payable once the referred trip is
completed, as the agent is told when their code is used.
"""

from collections import defaultdict

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone

from audit.utils import log_action
from bookings.currency import format_amount
from notifications.service import notify

from .models import AgentPayoutDetails, ReferralRedemption

# bookings.models.Booking.STAGE_COMPLETED (bookings imports this app, not the reverse).
TRIP_COMPLETED = "completed"


def payable(queryset=None):
    """Commission earned and not yet paid: pending, on a completed trip."""
    queryset = ReferralRedemption.objects.all() if queryset is None else queryset
    return queryset.filter(commission_status=ReferralRedemption.STATUS_PENDING, booking__stage=TRIP_COMPLETED)


def record_payout(redemptions, *, admin, method, reference=""):
    """Marks the payable ones among `redemptions` (one agent, one currency) paid, and
    emails the agent once. Rows already paid, or whose trip hasn't finished, are left as
    they are. Returns the rows marked paid."""
    with transaction.atomic():
        rows = list(
            payable(redemptions)
            .select_for_update(of=("self",))
            .select_related("code__agent", "booking")
            .order_by("created_at")
        )
        now = timezone.now()
        for row in rows:
            row.commission_status = ReferralRedemption.STATUS_PAID
            row.paid_at = now
            row.paid_by = admin
            row.payout_method = method
            row.payout_reference = reference
            row.save(update_fields=["commission_status", "paid_at", "paid_by", "payout_method", "payout_reference"])
    if rows:
        _announce(rows, admin, method, reference)
    return rows


def _announce(rows, admin, method, reference):
    agent = rows[0].code.agent
    currency = rows[0].booking.currency
    total = format_amount(sum(row.commission_amount for row in rows), currency)
    method_label = dict(ReferralRedemption._meta.get_field("payout_method").choices).get(method, method)
    bookings = ", ".join(f"#{row.booking_id}" for row in rows)
    notify(
        agent,
        f"Commission paid — {total}",
        f"Sent by {method_label.lower()}{f' (reference {reference})' if reference else ''} for "
        f"booking{'s' if len(rows) > 1 else ''} {bookings}. Thank you for referring travellers to "
        "Pande Wilderness Safari.",
        link="/account/agent",
    )
    log_action(
        admin,
        "referral.commission_paid",
        f"Paid {total} commission to {agent.email} by {method_label}"
        f"{f' (ref {reference})' if reference else ''} for booking(s) "
        + ", ".join(f"#{row.booking_id}" for row in rows),
    )


def agent_summaries():
    """One row per agent with any redemption: what they're owed now, what's waiting on a
    trip to finish, and what's been paid — each per currency, never added across them."""
    money = (
        ReferralRedemption.objects.values("code__agent", "booking__currency")
        .annotate(
            payable=Sum(
                "commission_amount",
                filter=Q(commission_status=ReferralRedemption.STATUS_PENDING, booking__stage=TRIP_COMPLETED),
                default=0,
            ),
            awaiting=Sum(
                "commission_amount",
                filter=Q(commission_status=ReferralRedemption.STATUS_PENDING) & ~Q(booking__stage=TRIP_COMPLETED),
                default=0,
            ),
            paid=Sum("commission_amount", filter=Q(commission_status=ReferralRedemption.STATUS_PAID), default=0),
            referrals=Count("id"),
        )
        .order_by()
    )
    by_agent = defaultdict(lambda: {"totals": {}, "referrals": 0})
    for row in money:
        entry = by_agent[row["code__agent"]]
        entry["referrals"] += row["referrals"]
        entry["totals"][row["booking__currency"]] = {
            "payable": row["payable"],
            "awaiting": row["awaiting"],
            "paid": row["paid"],
        }
    details = {d.agent_id: d for d in AgentPayoutDetails.objects.filter(agent_id__in=by_agent)}
    return by_agent, details
