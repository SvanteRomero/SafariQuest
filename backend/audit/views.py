from rest_framework import generics

from accounts.permissions import IsAdminRole
from config.pagination import StandardPagination

from .models import AuditLogEntry
from .serializers import AuditLogEntrySerializer


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AuditLogEntrySerializer
    pagination_class = StandardPagination
    # Was `[:200]` — a hand-rolled, weaker version of exactly what real
    # pagination now does (and a sliced queryset can't be paginated further,
    # so the slice had to go regardless). Ordering is unaffected: it comes
    # from AuditLogEntry.Meta.ordering, not from this queryset.
    queryset = AuditLogEntry.objects.select_related("actor")
