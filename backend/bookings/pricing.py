"""What a checkout booking costs, computed on the server.

The checkout pages (website/src/pages/Checkout.tsx, pages/plan/PlanPayment.tsx)
show the tourist the same numbers before they pay; the server used to record
whatever amounts the page sent back, so any caller could set their own price.
The arithmetic here deliberately mirrors the browser's — IEEE floats and
Math.round's round-half-up — so the figure on screen is the figure recorded.
Change one side and the other has to change with it.
"""

import math

from pricing.models import Season
from referrals.models import ReferralCode, ReferralSettings

from .currency import product_price

CHILD_RATE = 0.5
DEPOSIT_RATE = 0.3
NO_REFERRAL = (None, None, None)


def _js_round(value: float) -> int:
    """JavaScript's Math.round for the positive amounts used here: halves round up."""
    return math.floor(value + 0.5)


def trip_total_for(booking, discount_percent=None) -> int:
    """In the booking's own currency. BookingCreateSerializer only accepts a currency the
    product has a price in, so the price is always there by the time this runs."""
    product = booking.safari if booking.safari_id else booking.region_safari
    base_price = product_price(product, booking.currency)
    # First season covering the start date, in the order the site lists them
    # (SeasonViewSet) — the same pick as lib/seasonalPrice.ts.
    season = (
        Season.objects.filter(start_date__lte=booking.start_date, end_date__gte=booking.start_date)
        .order_by("start_date", "id")
        .first()
    )
    adult_price = _js_round(base_price * float(season.multiplier)) if season else base_price
    child_price = _js_round(adult_price * CHILD_RATE)
    adults = booking.guests - booking.children
    total = adult_price * adults + child_price * booking.children
    if discount_percent:
        total = _js_round(total * (1 - float(discount_percent) / 100))
    return total


def deposit_for(trip_total: int) -> int:
    return _js_round(trip_total * DEPOSIT_RATE)


def referral_terms(code_value, user):
    """(code, discount %, commission %) for a referral code, at today's referral
    settings; None if it can't be used. exclude(agent=...): an agent can also book, and
    must not collect commission on their own trip — the validate endpoint refuses that at
    checkout, this is the backstop. The code is only marked used once the payment
    completes (complete_payment re-checks it under a lock), so an abandoned checkout
    doesn't burn it."""
    code = ReferralCode.objects.filter(code=code_value, is_used=False).exclude(agent=user).first()
    if code is None or code.is_expired:
        return None
    settings_obj = ReferralSettings.get_solo()
    return code, settings_obj.discount_percent, settings_obj.commission_percent


def quote_terms(booking):
    """(trip total, referral terms) for paying the deposit on a quote an admin has sent:
    the quote's total, less the discount of the referral code entered with the request
    while that code can still be used. Used both to show the deposit on My Trips and to
    charge it, so the two agree."""
    terms = NO_REFERRAL
    if booking.referral_code_entered:
        terms = referral_terms(booking.referral_code_entered, booking.customer) or NO_REFERRAL
    total = booking.subtotal
    discount_percent = terms[1]
    if discount_percent:
        total = _js_round(total * (1 - float(discount_percent) / 100))
    return total, terms
