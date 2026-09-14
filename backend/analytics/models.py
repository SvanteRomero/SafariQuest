from django.db import models


class FunnelEvent(models.Model):
    """A single step of an anonymous visitor's Trip Curator journey (8.2). session_id is a random
    id the frontend generates once per browser and stores locally — not tied to any account —
    so the funnel can report unique-visitor counts per step without identifying anyone."""

    STEP_VISITED = "visited"
    STEP_STARTED = "started"
    STEP_SUBMITTED = "submitted"
    STEP_CHOICES = [
        (STEP_VISITED, "Visited Trip Curator"),
        (STEP_STARTED, "Started Choosing Experiences"),
        (STEP_SUBMITTED, "Submitted Inquiry"),
    ]

    step = models.CharField(max_length=20, choices=STEP_CHOICES)
    session_id = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["step"])]

    def __str__(self):
        return f"{self.step} ({self.session_id})"
