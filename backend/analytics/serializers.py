from rest_framework import serializers

from .models import FunnelEvent


class FunnelEventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunnelEvent
        fields = ["step", "session_id"]
