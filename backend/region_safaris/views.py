from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import RegionSafari
from .serializers import RegionSafariSerializer


class RegionSafariViewSet(viewsets.ModelViewSet):
    queryset = RegionSafari.objects.all().select_related("region").prefetch_related("itinerary", "parks")
    serializer_class = RegionSafariSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
