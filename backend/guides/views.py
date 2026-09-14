from django.db import transaction
from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from audit.utils import log_action

from .models import Guide
from .serializers import (
    GuideCertificationInputSerializer,
    GuideCreatedSerializer,
    GuideCreateSerializer,
    GuideSelfUpdateSerializer,
    GuideSerializer,
)


class GuideViewSet(viewsets.ModelViewSet):
    # certifications is nested in GuideSerializer on every list/retrieve; without
    # prefetch_related that was one extra query per guide in the list.
    queryset = Guide.objects.all().order_by("name").prefetch_related("certifications")
    serializer_class = GuideSerializer
    permission_classes = [IsAdminRole]

    def get_permissions(self):
        if self.action in ("me", "certifications", "reviews"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def _get_own_guide(self, request):
        try:
            return Guide.objects.get(user=request.user)
        except Guide.DoesNotExist:
            raise NotFound("No guide profile is linked to this account.")

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        guide = self._get_own_guide(request)
        if request.method == "PATCH":
            serializer = GuideSelfUpdateSerializer(guide, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            # Guide.name and the linked User.name are kept in sync deliberately;
            # a crash between the two saves used to be able to leave them
            # disagreeing about the guide's own name.
            with transaction.atomic():
                serializer.save()
                if "name" in serializer.validated_data:
                    request.user.name = serializer.validated_data["name"]
                    request.user.save(update_fields=["name"])
        return Response(GuideSerializer(guide).data)

    @action(detail=False, methods=["post"], url_path="me/certifications")
    def certifications(self, request):
        guide = self._get_own_guide(request)
        serializer = GuideCertificationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(guide=guide)
        return Response(GuideSerializer(guide).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="me/reviews")
    def reviews(self, request):
        guide = self._get_own_guide(request)
        # Was 7 queries for a guide with any reviews: one .count() per star
        # (5), one overall .count(), then iterating the queryset for the
        # review list below. One GROUP BY for the histogram, and len() on the
        # already-fetched list for the total, bring that down to 2.
        qs = list(guide.reviews.all().select_related("booking", "booking__customer"))
        counts_by_stars = {
            row["guide_rating"]: row["count"]
            for row in guide.reviews.values("guide_rating").annotate(count=Count("id"))
        }
        distribution = [{"stars": stars, "count": counts_by_stars.get(stars, 0)} for stars in range(5, 0, -1)]
        return Response(
            {
                "average": float(guide.rating),
                "count": len(qs),
                "distribution": distribution,
                "reviews": [
                    {
                        "guest_name": r.booking.customer.name or "Anonymous",
                        "guide_rating": r.guide_rating,
                        "trip_rating": r.trip_rating,
                        "testimonial": r.testimonial,
                        "created_at": r.created_at,
                    }
                    for r in qs
                ],
            }
        )


class GuideCreateWithAccountView(APIView):
    """Creates a guide's login account and their Guide profile together.

    Returns a one-time temporary password for the admin to share with the
    guide directly (WhatsApp, in person, etc.) — nothing is emailed.
    """

    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = GuideCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guide = serializer.save()
        log_action(request.user, "guide.created", f"Created guide account for {guide.name}")
        return Response(GuideCreatedSerializer(guide).data, status=status.HTTP_201_CREATED)
