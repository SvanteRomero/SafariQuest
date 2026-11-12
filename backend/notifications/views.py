from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import NotificationSerializer

# The bell shows the latest few; older ones age out of view, not out of the database.
LIST_LIMIT = 30


class NotificationListView(APIView):
    """The signed-in user's latest notifications and how many are unread."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        mine = request.user.notifications.all()
        return Response(
            {
                "unread": mine.filter(read_at=None).count(),
                "results": NotificationSerializer(mine[:LIST_LIMIT], many=True).data,
            }
        )


class _ReadInput(serializers.Serializer):
    # Omitted: mark all of them read.
    id = serializers.IntegerField(required=False)


class NotificationReadView(APIView):
    """Marks one notification (or, without an id, all of them) read."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = _ReadInput(data=request.data)
        data.is_valid(raise_exception=True)
        unread = request.user.notifications.filter(read_at=None)
        if "id" in data.validated_data:
            unread = unread.filter(pk=data.validated_data["id"])
        unread.update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)
