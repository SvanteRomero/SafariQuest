from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from bookings.models import Booking

from .models import FunnelEvent
from .serializers import FunnelEventCreateSerializer


class FunnelEventCreateView(generics.CreateAPIView):
    """Records one Trip Curator funnel step (8.2). Open to anonymous visitors — that's the whole
    point of a top-of-funnel event — so there's nothing sensitive to protect here."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "funnel_event"
    serializer_class = FunnelEventCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)


class FunnelSummaryView(APIView):
    """Unique-session counts per Trip Curator step, plus how many of those inquiries went on to
    a confirmed booking — the one step derived from real Booking data rather than an event."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        def unique_sessions(step):
            return FunnelEvent.objects.filter(step=step).values("session_id").distinct().count()

        # Every booking has exactly one of safari/region_safari (enforced by a DB
        # check constraint on Booking), so the stage filter alone already
        # covers both product types. The region_safari__isnull=False clause
        # this replaced silently dropped every SafariPackage (multi-region)
        # booking from the conversion count — undercounting the more common
        # of the two products.
        confirmed = Booking.objects.filter(
            stage__in=[Booking.STAGE_CONFIRMED, Booking.STAGE_COMPLETED],
        ).count()

        return Response(
            {
                "visited": unique_sessions(FunnelEvent.STEP_VISITED),
                "started": unique_sessions(FunnelEvent.STEP_STARTED),
                "submitted": unique_sessions(FunnelEvent.STEP_SUBMITTED),
                "confirmed": confirmed,
            }
        )
