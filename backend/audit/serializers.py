from rest_framework import serializers

from .models import AuditLogEntry


class AuditLogEntrySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLogEntry
        fields = ["id", "actor_name", "action", "description", "created_at"]

    def get_actor_name(self, obj):
        if obj.actor is None:
            return "System"
        return obj.actor.name or obj.actor.email
