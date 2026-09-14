from rest_framework.routers import DefaultRouter

from .views import RegionSafariViewSet

router = DefaultRouter()
router.register("", RegionSafariViewSet, basename="region-safari")

urlpatterns = router.urls
