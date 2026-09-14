from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

User = get_user_model()

# config.settings nulls every throttle rate while running tests, because throttle
# counters live in LocMemCache and would otherwise leak across unrelated cases
# until some innocent test started getting 429s. These tests opt back in.
#
# patch.dict rather than override_settings: SimpleRateThrottle reads
# THROTTLE_RATES as a CLASS attribute bound at import time, so overriding
# REST_FRAMEWORK in settings has no effect on an already-imported throttle class.
TEST_RATES = {
    "anon": "1000/hour",
    "user": "3000/hour",
    "login": "2/min",
    "signup": "2/hour",
    "booking_create": "1/hour",
    "funnel_event": "2/hour",
}


@mock.patch.dict(SimpleRateThrottle.THROTTLE_RATES, TEST_RATES)
class LoginThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        User.objects.create_user(email="throttle@example.com", password="correct-pw-123")

    def test_repeated_failed_logins_are_throttled(self):
        url = reverse("login")
        bad = {"email": "throttle@example.com", "password": "wrong"}
        self.assertEqual(self.client.post(url, bad).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post(url, bad).status_code, status.HTTP_401_UNAUTHORIZED)
        # Third attempt is over the 2/min ceiling.
        self.assertEqual(self.client.post(url, bad).status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_valid_credentials_do_not_reset_the_ip_bucket(self):
        """Finding one valid pair must not hand an attacker a fresh quota.

        Cookies are dropped between attempts so every request stays anonymous,
        which is the attacker's actual position. This matters because
        ScopedRateThrottle keys authenticated requests by user.pk and anonymous
        ones by IP: a client that already holds a valid auth cookie is counted
        in a different bucket. Harmless for the threat we care about — nobody
        brute-forcing logins has a valid cookie — but worth pinning down so a
        future change doesn't turn it into a bypass.
        """
        url = reverse("login")
        bad = {"email": "throttle@example.com", "password": "wrong"}
        good = {"email": "throttle@example.com", "password": "correct-pw-123"}

        self.assertEqual(self.client.post(url, bad).status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.cookies.clear()
        self.assertEqual(self.client.post(url, good).status_code, status.HTTP_200_OK)
        self.client.cookies.clear()
        self.assertEqual(self.client.post(url, bad).status_code, status.HTTP_429_TOO_MANY_REQUESTS)


@mock.patch.dict(SimpleRateThrottle.THROTTLE_RATES, TEST_RATES)
class AnonymousWriteThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

    def test_funnel_event_firehose_is_throttled(self):
        url = reverse("funnel-event-create")
        payload = {"step": "visited", "session_id": "abc123"}
        self.assertEqual(self.client.post(url, payload).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.client.post(url, payload).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.client.post(url, payload).status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_booking_create_is_throttled(self):
        """Anonymous booking creation mints a User row and mails a caller-supplied
        address, so it carries its own tight scope rather than the anon default.
        The throttle has to bite regardless of whether the payload validates."""
        url = reverse("booking-list")
        self.assertNotEqual(self.client.post(url, {}).status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(self.client.post(url, {}).status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_reads_are_not_throttled_by_the_write_scope(self):
        """Browsing must stay on the generous anon default — a visitor reading the
        public catalogue should never hit the booking_create ceiling."""
        for _ in range(5):
            response = self.client.get(reverse("safari-list"))
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
