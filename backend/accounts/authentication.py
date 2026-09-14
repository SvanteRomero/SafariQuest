from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication


class _CsrfCheck(CsrfViewMiddleware):
    """CsrfViewMiddleware that hands the failure reason back instead of rendering a 403.

    DRF wraps every APIView in csrf_exempt, so the CsrfViewMiddleware listed in
    MIDDLEWARE never guards an API endpoint. Cookie-borne credentials need the
    check to happen somewhere, so it happens here — the same approach DRF's own
    SessionAuthentication takes.
    """

    def _reject(self, request, reason):
        return reason


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        self.enforce_csrf(request)
        return self.get_user(validated_token), validated_token

    def enforce_csrf(self, request):
        """Reject an unsafe request that rides on the auth cookie without a CSRF token.

        Without this, any page on the internet can make a logged-in browser issue
        POST/PATCH/DELETE against this API — the cookie is attached automatically,
        and AUTH_COOKIE_SAMESITE is "None" in the cross-domain deployment.

        CsrfViewMiddleware skips safe methods (GET/HEAD/OPTIONS/TRACE) and any
        request whose _dont_enforce_csrf_checks is set, which is what DRF's test
        client does by default — so this is inert for safe reads and for tests
        that don't opt into CSRF enforcement.
        """

        def dummy_get_response(_request):
            return None

        check = _CsrfCheck(dummy_get_response)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF failed: {reason}")
