from django.urls import path

from .views import FunnelEventCreateView, FunnelSummaryView

urlpatterns = [
    path("events/", FunnelEventCreateView.as_view(), name="funnel-event-create"),
    path("funnel/", FunnelSummaryView.as_view(), name="funnel-summary"),
]
