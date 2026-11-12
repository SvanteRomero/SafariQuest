import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard } from '@phosphor-icons/react'
import type { PaymentCheckout, PayOptions } from '../../api/bookings'
import { ApiError } from '../../lib/api'
import { EMPTY_CARD_BILLING, isCardBillingComplete } from '../../lib/cardBilling'
import { canPayWith } from '../../lib/mobileNumbers'
import { CardBillingFields } from './CardBillingFields'
import { CardPaymentWaiting } from './CardPaymentWaiting'
import { PaymentWaiting } from './PaymentWaiting'
import { PhoneNumberField } from './PhoneNumberField'

const BUTTON_CLASS =
  'w-full inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'

/** How a trip is paid: a phone prompt (Snippe direct), Snippe's checkout page (hosted),
 * or Senjaropay's card page in a new tab (USD). */
export type TripPayMethod = 'phone' | 'hosted' | 'card'

/** One "Pay …" action on a trip card (the deposit retry, or the remaining balance).
 * Hosted sends the browser to Snippe's page. Phone opens a number field in the card,
 * sends the prompt and waits for the PIN right there; card asks for the billing details,
 * then waits while the tourist pays on Senjaropay's page. */
export function TripPayButton({
  bookingId,
  label,
  method,
  disabled,
  note,
  start,
  onPaid,
}: Readonly<{
  bookingId: number
  label: string
  method: TripPayMethod
  disabled: boolean
  /** Shown under the button, e.g. why it's disabled. */
  note?: string | null
  start: (options: Pick<PayOptions, 'phoneNumber' | 'billing'>) => Promise<PaymentCheckout>
  onPaid: () => void
}>) {
  const { t } = useTranslation('booking')
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [billing, setBilling] = useState(EMPTY_CARD_BILLING)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState<PaymentCheckout | null>(null)

  async function handleStart() {
    setError(null)
    setStarting(true)
    try {
      const checkout = await start({
        phoneNumber: method === 'phone' ? phone : undefined,
        billing: method === 'card' ? billing : undefined,
      })
      if (checkout.mode === 'hosted') {
        window.location.assign(checkout.checkoutUrl)
        return
      }
      setWaiting(checkout)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
    setStarting(false)
  }

  if (waiting?.mode === 'card') {
    return (
      <div className="mb-2">
        <CardPaymentWaiting
          bookingId={bookingId}
          paymentId={waiting.paymentId}
          checkoutUrl={waiting.checkoutUrl}
          amount={waiting.amount}
          currency={waiting.currency}
          onCompleted={onPaid}
          onTryAgain={() => setWaiting(null)}
        />
      </div>
    )
  }

  if (waiting) {
    return (
      <div className="mb-2">
        <PaymentWaiting
          bookingId={bookingId}
          paymentId={waiting.paymentId}
          phoneMasked={waiting.phoneMasked}
          amount={waiting.amount}
          currency={waiting.currency}
          onCompleted={onPaid}
          onTryAgain={() => setWaiting(null)}
        />
      </div>
    )
  }

  if (method !== 'hosted' && open) {
    const ready = method === 'phone' ? canPayWith(phone) : isCardBillingComplete(billing)
    return (
      <div className="mb-2 space-y-3 rounded-xl border border-sand-stone p-4">
        {method === 'phone' ? (
          <PhoneNumberField id={`trip-${bookingId}-phone`} value={phone} onChange={setPhone} disabled={starting} />
        ) : (
          <CardBillingFields
            idPrefix={`trip-${bookingId}-billing`}
            value={billing}
            onChange={setBilling}
            disabled={starting}
            stacked
          />
        )}
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        {method === 'card' && !ready && (
          <p id={`trip-${bookingId}-pay-hint`} className="text-xs text-on-surface-variant">
            {t('cardPay.completeHint')}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={disabled || starting || !ready}
          aria-describedby={method === 'card' && !ready ? `trip-${bookingId}-pay-hint` : undefined}
          className={BUTTON_CLASS}
        >
          <CreditCard size={18} weight="bold" />
          {starting ? 'Processing…' : label}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full min-h-[44px] text-on-surface-variant font-label-md hover:text-savanna-green transition-colors"
        >
          {t('mobilePay.cancel')}
        </button>
      </div>
    )
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => (method === 'hosted' ? void handleStart() : setOpen(true))}
        disabled={disabled || starting}
        className={BUTTON_CLASS}
      >
        <CreditCard size={18} weight="bold" />
        {starting ? 'Processing…' : label}
      </button>
      {note && <p className="text-sm text-on-surface-variant mt-2">{note}</p>}
      {error && (
        <p role="alert" className="text-error text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
