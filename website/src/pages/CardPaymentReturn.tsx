import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HourglassMedium, WarningCircle, XCircle } from '@phosphor-icons/react'
import { Link } from '../i18n/routing'
import { useLocalizedNavigate as useNavigate } from '../i18n/useLocale'
import { findCardPayment, type CardReturnOutcome } from '../api/bookings'
import { useAuth } from '../auth/AuthContext'

type View = 'checking' | 'failed' | 'cancelled'

/** How Senjaropay names the payment in the URL: order_id=CARD-… at first, now
 * ref=<its own id>. The server matches what it can and otherwise takes the tourist's
 * latest checkout. */
function referenceFrom(search: string): string {
  const params = new URLSearchParams(search)
  return params.get('order_id') ?? params.get('reference') ?? params.get('ref') ?? ''
}

/**
 * Where Senjaropay's card page sends the tourist afterwards: its Success, Fail and Cancel
 * redirect URLs are this site's /success, /fail and /cancel, each with ?order_id=CARD-….
 * The page works out which booking the payment belongs to; the outcome itself comes from
 * the server, which asks Senjaropay — the URL alone is never trusted.
 *
 * Paid: on to the same pages a mobile money payment ends on (the booking confirmation for
 * a deposit, My Trips for a balance). Failed or cancelled: says nothing was charged and
 * offers another try from My Trips, where the pay button opens a fresh checkout.
 */
export function CardPaymentReturn({ outcome }: Readonly<{ outcome: CardReturnOutcome }>) {
  const { t } = useTranslation('booking')
  const { search } = useLocation()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const [result, setResult] = useState<View | null>(null)
  const reference = referenceFrom(search)
  const view: View = result ?? 'checking'

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      // Signed out in this tab: sign in, then come straight back here.
      // `next` is unprefixed: sign-in adds the locale itself.
      void navigate(`/sign-in?next=${encodeURIComponent(`/${outcome}${search}`)}`, { replace: true })
      return
    }
    let cancelled = false
    findCardPayment(reference, outcome)
      .then((payment) => {
        if (cancelled) return
        if (payment.status === 'completed' || outcome === 'success') {
          const query = `booking=${payment.bookingId}&payment=${payment.paymentId}`
          void navigate(payment.kind === 'deposit' ? `/booking-confirmed?${query}` : `/account?${query}`, {
            replace: true,
          })
          return
        }
        setResult(outcomeView(outcome))
      })
      .catch(() => {
        if (cancelled) return
        // No card payment of theirs to show: a success still lands on My Trips, where
        // every trip's status is shown; a failure or cancellation says nothing was charged.
        if (outcome === 'success') void navigate('/account', { replace: true })
        else setResult(outcomeView(outcome))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, reference, outcome])

  const { icon: Icon, iconClass } = VIEW_ICON[view]
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
      <div className="max-w-xl" role="status" aria-live="polite">
        <Icon size={48} className={`mx-auto mb-6 ${iconClass}`} />
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t(`cardReturn.${view}Heading`)}</h1>
        <p className="text-on-surface-variant mb-8">{t(`cardReturn.${view}Body`)}</p>
        {view !== 'checking' && (
          <Link
            to="/account"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            {t('cardReturn.tryAgain')}
          </Link>
        )}
      </div>
    </section>
  )
}

function outcomeView(outcome: CardReturnOutcome): View {
  return outcome === 'cancel' ? 'cancelled' : 'failed'
}

const VIEW_ICON: Record<View, { icon: typeof HourglassMedium; iconClass: string }> = {
  checking: { icon: HourglassMedium, iconClass: 'text-savanna-green' },
  failed: { icon: WarningCircle, iconClass: 'text-error' },
  cancelled: { icon: XCircle, iconClass: 'text-on-surface-variant' },
}
