from django.contrib import admin

from .models import SupportTicket, SupportTicketNote


class SupportTicketNoteInline(admin.TabularInline):
    model = SupportTicketNote
    extra = 0


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ["id", "reporter", "status", "category", "created_at"]
    list_filter = ["status"]
    inlines = [SupportTicketNoteInline]
