from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()


class CsrfEnforcementTests(APITestCase):
    """DRF marks every APIView csrf_exempt, so CsrfViewMiddleware never sees these
    endpoints. Cookie-borne JWTs therefore need CookieJWTAuthentication to run the
    check itself, and these tests pin that behaviour down.
    """

    def setUp(self):
        # The default test client sets _dont_enforce_csrf_checks, which is the
        # right default for the other 174 tests but would make these vacuous.
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = User.objects.create_user(email="csrf@example.com", password="original-pw-123")
        login = self.client.post(
            reverse("login"), {"email": "csrf@example.com", "password": "original-pw-123"}
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def _csrf_token(self):
        response = self.client.get(reverse("csrf"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["csrfToken"]

    def test_csrf_endpoint_returns_token_and_sets_cookie(self):
        response = self.client.get(reverse("csrf"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["csrfToken"])
        self.assertIn("csrftoken", response.cookies)

    def test_unsafe_request_without_csrf_token_is_rejected(self):
        response = self.client.post(
            reverse("change-password"),
            {"current_password": "original-pw-123", "new_password": "a-different-pw-456"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("CSRF failed", str(response.data["detail"]))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("original-pw-123"))

    def test_unsafe_request_with_csrf_token_succeeds(self):
        token = self._csrf_token()
        response = self.client.post(
            reverse("change-password"),
            {"current_password": "original-pw-123", "new_password": "a-different-pw-456"},
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("a-different-pw-456"))

    def test_safe_request_needs_no_csrf_token(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "csrf@example.com")

    def test_anonymous_request_is_unaffected(self):
        anonymous = APIClient(enforce_csrf_checks=True)
        response = anonymous.get(reverse("csrf"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
