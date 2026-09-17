from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_TOURIST = "tourist"
    ROLE_GUIDE = "guide"
    ROLE_ADMIN = "admin"
    ROLE_REFERRAL_AGENT = "referral_agent"

    ROLE_CHOICES = [
        (ROLE_TOURIST, "Tourist"),
        (ROLE_GUIDE, "Guide"),
        (ROLE_ADMIN, "Administrator"),
        (ROLE_REFERRAL_AGENT, "Referral Agent"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_TOURIST)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
