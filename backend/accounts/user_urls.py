from django.urls import path

from .views import UserDetailView, UserInviteView

urlpatterns = [
    path("", UserInviteView.as_view(), name="invite-user"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
