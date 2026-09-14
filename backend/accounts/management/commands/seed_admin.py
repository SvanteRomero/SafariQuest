import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Seed (or update) the admin user from ADMIN_EMAIL / ADMIN_PASSWORD "
        "environment variables. Safe to run on every deploy — idempotent."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "")
        name = os.environ.get("ADMIN_NAME", "").strip()

        if not email or not password:
            raise CommandError(
                "ADMIN_EMAIL and ADMIN_PASSWORD must both be set to seed the admin user."
            )

        email = User.objects.normalize_email(email)
        user, created = User.objects.get_or_create(email=email, defaults={"name": name})

        user.name = name or user.name
        user.role = User.ROLE_ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} admin user {email}"))
