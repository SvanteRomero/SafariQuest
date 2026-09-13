from rest_framework import viewsets

from accounts.permissions import IsAdminOrReadOnly

from .models import Season
from .serializers import SeasonSerializer


class SeasonViewSet(viewsets.ModelViewSet):
    """Seasons are public-read so the site can price a package for a given trip date (5.3) —
    only Administrators can create/edit them."""

    queryset = Season.objects.all().order_by("start_date")
    serializer_class = SeasonSerializer
    permission_classes = [IsAdminOrReadOnly]
