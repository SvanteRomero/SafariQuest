from django.conf import settings
from django.db import models


class Guide(models.Model):
    ROLE_CHOICES = [
        ("Senior Guide", "Senior Guide"),
        ("Expert Guide", "Expert Guide"),
        ("Driver-Guide", "Driver-Guide"),
        ("Camp Chef", "Camp Chef"),
        ("Tour Helper", "Tour Helper"),
    ]
    STATUS_CHOICES = [
        ("Available", "Available"),
        ("On Trip", "On Trip"),
        ("Off-Duty", "Off-Duty"),
    ]

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Available")
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)
    bio = models.TextField(blank=True)
    languages = models.JSONField(default=list, blank=True)
    specialties = models.JSONField(default=list, blank=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="guide_profile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return self.name

    def recompute_rating(self):
        from django.db.models import Avg

        avg = self.reviews.aggregate(avg=Avg("guide_rating"))["avg"]
        self.rating = round(avg, 1) if avg is not None else 0
        self.save(update_fields=["rating"])


class GuideCertification(models.Model):
    guide = models.ForeignKey(Guide, related_name="certifications", on_delete=models.CASCADE)
    title = models.CharField(max_length=150)
    valid_until = models.DateField(null=True, blank=True)
    document = models.URLField(max_length=500, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.guide_id}: {self.title}"
