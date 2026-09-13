from django.contrib import admin

from .models import FunnelEvent


@admin.register(FunnelEvent)
class FunnelEventAdmin(admin.ModelAdmin):
    list_display = ["step", "session_id", "created_at"]
    list_filter = ["step"]
