import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone

# Unambiguous alphabet — no 0/O or 1/I, so a code read aloud or handwritten by a
# field agent can't be misheard/misread into a different valid-looking code.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 8

# Agents share codes long after generating them (a screenshot in a gallery, a post that stays
# up for months), so the default lifetime is six months rather than days.
DEFAULT_CODE_EXPIRY_DAYS = 180
MIN_CODE_EXPIRY_DAYS = 1
MAX_CODE_EXPIRY_DAYS = 730

# How a commission was (or should be) paid. Agents choose between the first two.
PAYOUT_MOBILE_MONEY = "mobile_money"
PAYOUT_BANK_TRANSFER = "bank_transfer"
PAYOUT_CASH = "cash"
PAYOUT_OTHER = "other"
PAYOUT_METHOD_CHOICES = [
    (PAYOUT_MOBILE_MONEY, "Mobile money"),
    (PAYOUT_BANK_TRANSFER, "Bank transfer"),
    (PAYOUT_CASH, "Cash"),
    (PAYOUT_OTHER, "Other"),
]


def generate_referral_code() -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        if not ReferralCode.objects.filter(code=code).exists():
            return code


class ReferralSettings(models.Model):
    """Singleton row (always pk=1) holding the admin-editable discount/commission rates."""

    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=2)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    code_expiry_days = models.PositiveIntegerField(default=DEFAULT_CODE_EXPIRY_DAYS)

    @classmethod
    def get_solo(cls) -> "ReferralSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Referral Settings"


class ReferralCode(models.Model):
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="referral_codes")
    code = models.CharField(max_length=CODE_LENGTH, unique=True, default=generate_referral_code)
    contact_name = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self._state.adding and not self.expires_at:
            days = ReferralSettings.get_solo().code_expiry_days
            self.expires_at = timezone.now() + timezone.timedelta(days=days)
        super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        return not self.is_used and timezone.now() > self.expires_at

    @property
    def status(self) -> str:
        if self.is_used:
            return "used"
        if self.is_expired:
            return "expired"
        return "active"

    def __str__(self):
        return self.code


class ReferralRedemption(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
    ]

    code = models.ForeignKey(ReferralCode, on_delete=models.PROTECT, related_name="redemptions")
    booking = models.OneToOneField("bookings.Booking", on_delete=models.CASCADE, related_name="referral_redemption")
    # Snapshots of the rates in effect at redemption time, so a later admin rate change
    # doesn't retroactively alter what's owed on a redemption that already happened.
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2)
    trip_total = models.PositiveIntegerField()
    commission_amount = models.PositiveIntegerField()
    commission_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    # The payout, recorded by the admin who sent the money (referrals.payouts). Money
    # leaves Pande outside this system — mobile money, a bank transfer — so this is the
    # record of when, how and with what reference, for both the admin and the agent.
    paid_at = models.DateTimeField(null=True, blank=True)
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    payout_method = models.CharField(max_length=20, choices=PAYOUT_METHOD_CHOICES, blank=True)
    payout_reference = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.code.code} -> booking #{self.booking_id}"

    @property
    def is_payable(self) -> bool:
        """Commission is earned once the referred trip has happened — the agent is told
        "paid out once the customer's trip is complete" when their code is used."""
        return self.commission_status == self.STATUS_PENDING and self.booking.stage == "completed"


class AgentPayoutDetails(models.Model):
    """Where an agent wants their commission sent. Entered by the agent on their
    dashboard, shown to the admin who pays them."""

    agent = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payout_details")
    method = models.CharField(max_length=20, choices=PAYOUT_METHOD_CHOICES[:2])
    account_name = models.CharField(max_length=150)
    # A mobile money number, or bank name + account number (+ branch / SWIFT if needed).
    account_details = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout details for {self.agent}"
