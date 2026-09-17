from django.contrib import admin

from .models import ReferralCode, ReferralRedemption, ReferralSettings

admin.site.register(ReferralSettings)
admin.site.register(ReferralCode)
admin.site.register(ReferralRedemption)
