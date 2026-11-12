"""Demo referral agents, referred bookings and commissions, for trying the payout flow
locally. Development only: refuses to run with DEBUG off.

Every account it creates has an @demo.test email, so `--reset` can remove exactly what
it made (and only that) before seeding again. The three agents sign in with the password
it prints (or --agent-password); the referred customers can't sign in.
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking, Invoice
from referrals.models import (
    PAYOUT_BANK_TRANSFER,
    PAYOUT_MOBILE_MONEY,
    AgentPayoutDetails,
    ReferralCode,
    ReferralRedemption,
    ReferralSettings,
)
from safaris.models import SafariPackage

User = get_user_model()

DEMO_DOMAIN = "@demo.test"

# (email, name, payout details or None)
AGENTS = [
    ("amani.agent@demo.test", "Amani Mushi", (PAYOUT_MOBILE_MONEY, "Amani Mushi", "M-Pesa 0754 123 456")),
    ("zuri.lodge@demo.test", "Zuri Lodge Arusha", (PAYOUT_BANK_TRANSFER, "Zuri Lodge Ltd", "CRDB Bank, 0150 2233 4455 00, Arusha")),
    ("kili.tours@demo.test", "Kilimanjaro Trails", None),
]

# (agent index, customer name, currency, stage, days from today the trip starts, guests,
#  paid days ago or None). Covers each state the admin page shows: payable now (trip
#  completed), awaiting the trip, and already paid.
REFERRALS = [
    (0, "Grace Thompson", "USD", Booking.STAGE_COMPLETED, -40, 2, None),
    (0, "Joseph Kimaro", "TZS", Booking.STAGE_COMPLETED, -25, 3, None),
    (0, "Lena Fischer", "USD", Booking.STAGE_CONFIRMED, 30, 2, None),
    (0, "Marco Rossi", "USD", Booking.STAGE_COMPLETED, -90, 4, 60),
    (1, "Sophie Martin", "TZS", Booking.STAGE_COMPLETED, -15, 2, None),
    (1, "Daniel Okoro", "TZS", Booking.STAGE_DEPOSIT_PAID, 60, 2, None),
    (1, "Emma Wilson", "USD", Booking.STAGE_COMPLETED, -120, 2, 95),
    (2, "Noah Becker", "USD", Booking.STAGE_COMPLETED, -10, 3, None),
]


class Command(BaseCommand):
    help = "Creates demo referral agents, referred bookings and commissions (development only)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Remove earlier demo data first.")
        parser.add_argument("--agent-password", default="", help="Sign-in for the demo agents (random if omitted).")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_referral_demo only runs with DEBUG=True — it's demo data, not for production.")
        safaris = list(SafariPackage.objects.exclude(price_usd=None).exclude(slug__startswith="usd-")[:4])
        if not safaris:
            raise CommandError("No safaris with a USD price to book. Run seed_safaris first.")
        agent_password = options["agent_password"] or secrets.token_urlsafe(9)
        with transaction.atomic():
            if options["reset"]:
                self._reset()
            elif User.objects.filter(email__endswith=DEMO_DOMAIN).exists():
                raise CommandError("Demo data already exists. Run again with --reset to recreate it.")
            agents = self._create_agents(agent_password)
            for i, row in enumerate(REFERRALS):
                self._create_referral(agents, safaris[i % len(safaris)], i, *row)
        self.stdout.write(self.style.SUCCESS(f"Created {len(AGENTS)} agents and {len(REFERRALS)} referred bookings."))
        self.stdout.write(f"Agents (sign-in password: {agent_password}):")
        for email, name, _details in AGENTS:
            self.stdout.write(f"  {name}: {email}")

    def _reset(self):
        demo_users = User.objects.filter(email__endswith=DEMO_DOMAIN)
        # Bookings first: they protect their customer, and take their redemptions along.
        Booking.objects.filter(customer__in=demo_users).delete()
        ReferralRedemption.objects.filter(code__agent__in=demo_users).delete()
        ReferralCode.objects.filter(agent__in=demo_users).delete()
        deleted, _ = demo_users.delete()
        self.stdout.write(f"Removed earlier demo data ({deleted} rows).")

    def _create_agents(self, agent_password):
        agents = []
        for email, name, details in AGENTS:
            agent = User.objects.create_user(
                email=email, password=agent_password, name=name, role=User.ROLE_TOURIST, is_referral_agent=True
            )
            if details:
                method, account_name, account_details = details
                AgentPayoutDetails.objects.create(
                    agent=agent, method=method, account_name=account_name, account_details=account_details
                )
            # An unused code too, so the agent's dashboard isn't only used codes.
            ReferralCode.objects.create(agent=agent, contact_name="Next client")
            agents.append(agent)
        return agents

    def _create_referral(self, agents, safari, index, agent_index, name, currency, stage, start_in, guests, paid_ago):
        rates = ReferralSettings.get_solo()
        today = timezone.localdate()
        customer = User.objects.create_user(
            email=f"{name.lower().replace(' ', '.')}{DEMO_DOMAIN}", name=name, role=User.ROLE_TOURIST
        )
        customer.set_unusable_password()
        customer.save(update_fields=["password"])
        start = today + timedelta(days=start_in)
        booking = Booking.objects.create(
            customer=customer,
            safari=safari,
            stage=stage,
            currency=currency,
            start_date=start,
            end_date=start + timedelta(days=safari.days),
            guests=guests,
        )
        price = safari.price_usd if currency == "USD" else safari.price
        trip_total = round(price * guests * (1 - float(rates.discount_percent) / 100))
        deposit = round(trip_total * 0.3)
        fully_paid = stage in (Booking.STAGE_CONFIRMED, Booking.STAGE_COMPLETED)
        Invoice.objects.create(
            booking=booking,
            amount=trip_total if fully_paid else deposit,
            trip_total=trip_total,
            status=Invoice.STATUS_PAID if fully_paid else Invoice.STATUS_DEPOSIT_PAID,
            due_date=start - timedelta(days=30),
        )
        code = ReferralCode.objects.create(
            agent=agents[agent_index], contact_name=name, is_used=True, used_at=timezone.now() - timedelta(days=5 + index)
        )
        redemption = ReferralRedemption.objects.create(
            code=code,
            booking=booking,
            discount_percent=rates.discount_percent,
            commission_percent=rates.commission_percent,
            trip_total=trip_total,
            commission_amount=round(trip_total * float(rates.commission_percent) / 100),
        )
        if paid_ago is not None:
            details = getattr(agents[agent_index], "payout_details", None)
            redemption.commission_status = ReferralRedemption.STATUS_PAID
            redemption.paid_at = timezone.now() - timedelta(days=paid_ago)
            redemption.payout_method = details.method if details else PAYOUT_MOBILE_MONEY
            redemption.payout_reference = f"DEMO{index:04d}PAY"
            redemption.save(
                update_fields=["commission_status", "paid_at", "payout_method", "payout_reference"]
            )
