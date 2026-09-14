from .models import AuditLogEntry


def log_action(actor, action, description):
    AuditLogEntry.objects.create(actor=actor, action=action, description=description)
