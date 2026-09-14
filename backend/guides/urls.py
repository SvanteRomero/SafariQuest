from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import GuideCreateWithAccountView, GuideViewSet

router = DefaultRouter()
router.register("", GuideViewSet, basename="guide")

urlpatterns = [
    path("create-with-account/", GuideCreateWithAccountView.as_view(), name="guide-create-with-account"),
] + router.urls
