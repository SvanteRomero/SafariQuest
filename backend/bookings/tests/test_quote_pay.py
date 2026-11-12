"""Trip-planner bookings ask for a quote instead of paying a package price: nothing is
payable until an admin sends the quote, and the deposit is then 30% of the quote."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from bookings.models import Booking, Invoice, Payment, QuoteLineItem
from notifications.models import Notification
from bookings.pricing import deposit_for
from bookings.tests.test_create import make_safari, trip_day
from bookings.tests.test_pay import SnippeTestMixin, make_booking
from referrals.models import ReferralCode, ReferralSettings

User = get_user_model()


def send_quote(booking, *prices):
    """What BookingViewSet.send_quote leaves behind: line items, the quoted stage and an
    unpaid invoice for the quoted total."""
    for price in prices:
        QuoteLineItem.objects.create(booking=booking, label="Item", quantity=1, unit_price=price)
    booking.stage = Booking.STAGE_QUOTED
    booking.save(update_fields=["stage"])
    Invoice.objects.create(booking=booking, amount=sum(prices), due_date=timezone.localdate() + timedelta(days=14))


class QuoteRequestCreateTests(APITestCase):
    def test_planner_request_is_stored_and_acknowledged(self):
        safari = make_safari()
        response = self.client.post(
            reverse("booking-list"),
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "safari": safari.slug,
                "start_date": trip_day(0),
                "end_date": trip_day(7),
                "guests": 2,
                "quote_requested": True,
                "referral_code": " abc123 ",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertTrue(booking.quote_requested)
        self.assertEqual(booking.referral_code_entered, "ABC123")
        self.assertTrue(
            Notification.objects.filter(user=booking.customer, title__contains="received your trip request").exists()
        )


class QuotePaymentTests(SnippeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.customer = User.objects.create_user(email="mark@example.com", password="pw12345", role="tourist")
        self.booking = make_booking(self.customer)
        self.booking.quote_requested = True
        self.booking.save(update_fields=["quote_requested"])
        self.client.post(reverse("login"), {"email": self.customer.email, "password": "pw12345"})

    def pay(self):
        return self.client.post(reverse("booking-pay", args=[self.booking.id]))

    def test_request_cannot_be_paid_before_the_quote(self):
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "quote_pending")
        self.assertEqual(self.snippe.requests, [])

    def test_deposit_is_thirty_percent_of_the_quote(self):
        send_quote(self.booking, 80000, 20000)
        listed = self.client.get(reverse("booking-list")).data["results"][0]
        self.assertEqual(listed["deposit_due"], 30000)

        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["amount"], 30000)
        self.confirm(response.data["payment_id"])

        payment = Payment.objects.get(pk=response.data["payment_id"])
        self.assertEqual(payment.needs_attention, "")
        invoice = Invoice.objects.get(booking=self.booking)
        self.assertEqual((invoice.amount, invoice.trip_total, invoice.status), (30000, 100000, Invoice.STATUS_DEPOSIT_PAID))
        self.assertEqual(invoice.remaining_balance, 70000)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.stage, Booking.STAGE_DEPOSIT_PAID)
        self.assertIsNone(self.client.get(reverse("booking-list")).data["results"][0]["deposit_due"])

    def test_quote_cannot_be_paid_twice(self):
        send_quote(self.booking, 100000)
        self.confirm(self.pay().data["payment_id"])
        self.booking.stage = Booking.STAGE_QUOTED
        self.booking.save(update_fields=["stage"])
        self.assertEqual(self.pay().status_code, status.HTTP_400_BAD_REQUEST)

    def test_referral_code_from_the_request_discounts_the_quote(self):
        agent = User.objects.create_user(email="agent@example.com", password="pw12345", role="tourist")
        code = ReferralCode.objects.create(agent=agent)
        self.booking.referral_code_entered = code.code
        self.booking.save(update_fields=["referral_code_entered"])
        send_quote(self.booking, 100000)
        discount = ReferralSettings.get_solo().discount_percent

        response = self.pay()
        payment = Payment.objects.get(pk=response.data["payment_id"])
        discounted = round(100000 * (1 - discount / 100))
        self.assertEqual(payment.referral_code, code)
        self.assertEqual(payment.trip_total, discounted)
        self.assertEqual(payment.amount, deposit_for(discounted))
