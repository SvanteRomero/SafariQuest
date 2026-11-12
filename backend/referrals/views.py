from django.contrib.auth import get_user_model
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from accounts.views import _set_auth_cookies, auth_payload
from audit.utils import log_action

from .models import AgentPayoutDetails, ReferralCode, ReferralRedemption, ReferralSettings
from .payouts import agent_summaries, record_payout
from .permissions import IsReferralAgentRole
from .serializers import (
    AdminReferralRedemptionSerializer,
    AgentPayoutDetailsSerializer,
    AgentPayoutInputSerializer,
    PayoutInputSerializer,
    ReferralAgentRegisterSerializer,
    ReferralCodeCreateSerializer,
    ReferralCodeSerializer,
    ReferralCodeValidateSerializer,
    ReferralSettingsPublicSerializer,
    ReferralSettingsSerializer,
)

User = get_user_model()


class ReferralAgentRegisterView(APIView):
    """Creates a new tourist account with the agent profile already on. For people who
    don't have an account yet — existing users use ReferralAgentActivateView."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = ReferralAgentRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        response = Response(auth_payload(user), status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, user)
        return response


class ReferralAgentActivateView(APIView):
    """Switches the agent profile on for the signed-in tourist, so a traveller can refer
    friends with the same login they booked with. Calling it again is harmless."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.ROLE_TOURIST:
            return Response(
                {"detail": "Staff and guide accounts can't become referral agents."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.is_referral_agent:
            user.is_referral_agent = True
            user.save(update_fields=["is_referral_agent"])
        return Response(auth_payload(user), status=status.HTTP_200_OK)


class ReferralCodeViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReferralCodeSerializer
    queryset = ReferralCode.objects.select_related("agent").prefetch_related("redemptions__booking")

    def get_permissions(self):
        return [IsReferralAgentRole()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReferralCodeCreateSerializer
        return ReferralCodeSerializer

    def get_queryset(self):
        return super().get_queryset().filter(agent=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.save()
        return Response(ReferralCodeSerializer(code).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        codes = self.get_queryset()
        return Response(ReferralCodeSerializer(codes, many=True).data)


class ReferralCodeValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReferralCodeValidateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first_error = str(next(iter(serializer.errors.values()))[0])
            return Response({"detail": first_error}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj = ReferralSettings.get_solo()
        return Response({"discountPercent": str(settings_obj.discount_percent)})


class ReferralSettingsPublicView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ReferralSettingsPublicSerializer

    def get_object(self):
        return ReferralSettings.get_solo()


class ReferralSettingsAdminView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ReferralSettingsSerializer

    def get_object(self):
        return ReferralSettings.get_solo()

    def perform_update(self, serializer):
        settings_obj = serializer.save()
        log_action(
            self.request.user,
            "referral.settings_changed",
            f"Referral rates set to {settings_obj.discount_percent}% discount, "
            f"{settings_obj.commission_percent}% commission, codes valid {settings_obj.code_expiry_days} days",
        )


class AgentPayoutDetailsView(APIView):
    """The signed-in agent's payout details: where their commission should be sent."""

    permission_classes = [IsReferralAgentRole]

    def get(self, request):
        details = AgentPayoutDetails.objects.filter(agent=request.user).first()
        return Response(AgentPayoutDetailsSerializer(details).data if details else None)

    def patch(self, request):
        details = AgentPayoutDetails.objects.filter(agent=request.user).first()
        serializer = AgentPayoutDetailsSerializer(details, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(agent=request.user)
        return Response(serializer.data)


class AdminReferralRedemptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminReferralRedemptionSerializer
    queryset = ReferralRedemption.objects.select_related("code__agent", "booking__customer", "paid_by").order_by(
        "-created_at"
    )

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        """Records that this one commission was paid. Only once the referred trip is
        completed — before that the commission isn't earned yet."""
        redemption = self.get_object()
        if redemption.commission_status == ReferralRedemption.STATUS_PAID:
            return Response({"detail": "This commission has already been paid."}, status=status.HTTP_400_BAD_REQUEST)
        if not redemption.is_payable:
            return Response(
                {"detail": "Commission is paid once the referred trip is completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PayoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record_payout(
            ReferralRedemption.objects.filter(pk=redemption.pk),
            admin=request.user,
            method=serializer.validated_data["method"],
            reference=serializer.validated_data["reference"].strip(),
        )
        redemption.refresh_from_db()
        return Response(AdminReferralRedemptionSerializer(redemption).data)


class AdminAgentPayoutsView(APIView):
    """Per agent: what's payable now, what waits on a trip finishing, what's been paid —
    so the admin can pay each agent everything they're owed in one go."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        by_agent, details = agent_summaries()
        agents = User.objects.filter(pk__in=by_agent).order_by("name", "email")
        return Response(
            [
                {
                    "agent_id": agent.id,
                    "name": agent.name,
                    "email": agent.email,
                    "referrals": by_agent[agent.id]["referrals"],
                    "totals": by_agent[agent.id]["totals"],
                    "payout_details": (
                        AgentPayoutDetailsSerializer(details[agent.id]).data if agent.id in details else None
                    ),
                }
                for agent in agents
            ]
        )


class AdminAgentPayView(APIView):
    """Records one payout covering everything payable to an agent in one currency."""

    permission_classes = [IsAdminRole]

    def post(self, request, agent_id):
        serializer = AgentPayoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        rows = record_payout(
            ReferralRedemption.objects.filter(code__agent_id=agent_id, booking__currency=data["currency"]),
            admin=request.user,
            method=data["method"],
            reference=data["reference"].strip(),
        )
        if not rows:
            return Response(
                {"detail": f"Nothing is payable to this agent in {data['currency']} right now."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "paid": len(rows),
                "currency": data["currency"],
                "total": sum(row.commission_amount for row in rows),
            }
        )
