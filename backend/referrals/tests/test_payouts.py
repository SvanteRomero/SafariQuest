"""Paying agents their commission: only once the referred trip is completed, recorded
with how and when it was paid, one currency at a time, and the agent is emailed."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking
from bookings.tests.test_pay import make_booking
from notifications.models import Notification
from referrals.models import AgentPayoutDetails, ReferralCode, ReferralRedemption

User = get_user_model()


class PayoutTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin")
        self.agent = User.objects.create_user(
            email="agent@example.com", password="pw12345", role="tourist", is_referral_agent=True
        )
        self.customer = User.objects.create_user(email="guest@example.com", password="pw12345", role="tourist")

    def redemption(self, stage=Booking.STAGE_COMPLETED, currency="USD", amount=300):
        booking = make_booking(self.customer, stage=stage)
        booking.currency = currency
        booking.save(update_fields=["currency"])
        code = ReferralCode.objects.create(agent=self.agent, is_used=True)
        return ReferralRedemption.objects.create(
            code=code, booking=booking, discount_percent=2, commission_percent=5, trip_total=amount * 20,
            commission_amount=amount,
        )

    def login(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def mark_paid(self, redemption, **body):
        url = reverse("admin-referral-redemption-mark-paid", args=[redemption.id])
        return self.client.post(url, {"method": "mobile_money", "reference": "QK7L2M9X", **body}, format="json")

    def test_commission_is_not_payable_before_the_trip_is_completed(self):
        redemption = self.redemption(stage=Booking.STAGE_CONFIRMED)
        self.login(self.admin)
        response = self.mark_paid(redemption)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        redemption.refresh_from_db()
        self.assertEqual(redemption.commission_status, ReferralRedemption.STATUS_PENDING)

    def test_marking_paid_records_the_payout_and_emails_the_agent(self):
        redemption = self.redemption()
        self.login(self.admin)
        response = self.mark_paid(redemption)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        redemption.refresh_from_db()
        self.assertEqual(redemption.commission_status, ReferralRedemption.STATUS_PAID)
        self.assertEqual((redemption.payout_method, redemption.payout_reference), ("mobile_money", "QK7L2M9X"))
        self.assertEqual(redemption.paid_by, self.admin)
        self.assertIsNotNone(redemption.paid_at)
        [notice] = Notification.objects.filter(user=self.agent)
        self.assertIn("USD 300", notice.title)
        self.assertEqual(self.mark_paid(redemption).status_code, status.HTTP_400_BAD_REQUEST)

    def test_paying_an_agent_settles_everything_payable_in_that_currency(self):
        first, second = self.redemption(amount=300), self.redemption(amount=200)
        waiting = self.redemption(stage=Booking.STAGE_CONFIRMED, amount=500)
        other_currency = self.redemption(currency="TZS", amount=90000)
        self.login(self.admin)
        response = self.client.post(
            reverse("admin-referral-agent-pay", args=[self.agent.id]),
            {"currency": "USD", "method": "bank_transfer", "reference": "BANK-1"},
            format="json",
        )
        self.assertEqual(response.data, {"paid": 2, "currency": "USD", "total": 500})
        statuses = {r.pk: r.commission_status for r in ReferralRedemption.objects.all()}
        self.assertEqual(statuses[first.pk], ReferralRedemption.STATUS_PAID)
        self.assertEqual(statuses[second.pk], ReferralRedemption.STATUS_PAID)
        self.assertEqual(statuses[waiting.pk], ReferralRedemption.STATUS_PENDING)
        self.assertEqual(statuses[other_currency.pk], ReferralRedemption.STATUS_PENDING)
        self.assertEqual(Notification.objects.filter(user=self.agent).count(), 1)

    def test_agent_summary_splits_payable_awaiting_and_paid_per_currency(self):
        self.redemption(amount=300)
        self.redemption(stage=Booking.STAGE_DEPOSIT_PAID, amount=500)
        self.redemption(currency="TZS", amount=90000)
        AgentPayoutDetails.objects.create(agent=self.agent, method="mobile_money", account_name="A", account_details="0754")
        self.login(self.admin)
        [row] = self.client.get(reverse("admin-referral-agents")).data
        self.assertEqual(row["referrals"], 3)
        self.assertEqual(row["totals"]["USD"], {"payable": 300, "awaiting": 500, "paid": 0})
        self.assertEqual(row["totals"]["TZS"], {"payable": 90000, "awaiting": 0, "paid": 0})
        self.assertEqual(row["payout_details"]["account_details"], "0754")

    def test_agent_saves_their_payout_details(self):
        self.login(self.agent)
        url = reverse("referral-payout-details")
        self.assertIsNone(self.client.get(url).data)
        body = {"method": "bank_transfer", "account_name": "Agent Ltd", "account_details": "CRDB 0150"}
        self.assertEqual(self.client.patch(url, body, format="json").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(url).data["account_name"], "Agent Ltd")

    def test_only_agents_have_payout_details(self):
        self.login(self.customer)
        self.assertEqual(self.client.get(reverse("referral-payout-details")).status_code, status.HTTP_403_FORBIDDEN)
