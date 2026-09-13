from django.urls import path

from .views import FinanceSummaryView

urlpatterns = [
    path("summary/", FinanceSummaryView.as_view(), name="finance-summary"),
]
