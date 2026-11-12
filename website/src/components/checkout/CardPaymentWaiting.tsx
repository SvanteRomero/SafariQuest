import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowSquareOut, CreditCard, WarningCircle } from '@phosphor-icons/react'
import { formatMoney, type Currency } from '../../lib/money'
import { usePaymentStatus } from '../../lib/usePaymentStatus'

// Polls back off from 3 to 15 seconds, so this is about 18 minutes: long enough to type
// in card details and pass the bank's check, inside the ~30 minutes Senjaropay's page
// stays open.
const CARD_MAX_POLLS = 80

/** A USD card payment waiting on Senjaropay's secure page, which opens in a new tab so
 * this page can keep checking the payment and move on by itself once it's paid. */
export function CardPaymentWaiting({
  bookingId,
  paymentId,
  checkoutUrl,
  amount,
  currency,
  onCompleted,
  onTryAgain,
}: Readonly<{
  bookingId: number
  paymentId: number
  checkoutUrl: string
  amount: number
  currency: Currency
  onCompleted: () => void
  onTryAgain: () => void
}>) {
  const { t, i18n } = useTranslation('booking')
  const { payment, gaveUp } = usePaymentStatus(bookingId, paymentId, { maxPolls: CARD_MAX_POLLS, backoff: true })
  const completedRef = useRef(false)
  const status = payment?.status

  useEffect(() => {
    if (status === 'completed' && !completedRef.current) {
      completedRef.current = true
      onCompleted()
    }
  }, [status, onCompleted])

  if (status === 'failed' || status === 'expired') {
    return (
      <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-6 text-center space-y-4">
        <WarningCircle size={40} weight="fill" className="mx-auto text-error" />
        <h3 className="font-headline-md text-[20px] text-on-surface">{t('cardPay.failedHeading')}</h3>
        <p className="text-on-surface-variant text-sm">{t('cardPay.failedBody')}</p>
        <button
          type="button"
          onClick={onTryAgain}
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 rounded-lg font-label-md hover:opacity-90 transition-opacity"
        >
          {t('cardPay.tryAgain')}
        </button>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-savanna-green/20 bg-savanna-green/10 p-6 text-center space-y-4">
      <CreditCard size={40} className="mx-auto text-savanna-green" />
      <h3 className="font-headline-md text-[20px] text-on-surface">{t('cardPay.waitingHeading')}</h3>
      <p className="text-on-surface">
        {t('cardPay.waitingBody', { amount: formatMoney(amount, i18n.language, currency) })}
      </p>
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary px-8 rounded-lg font-label-md hover:opacity-90 transition-opacity"
      >
        {t('cardPay.openPage')}
        <ArrowSquareOut size={18} weight="bold" />
      </a>
      <p className="text-on-surface-variant text-sm">{gaveUp ? t('cardPay.stillWaiting') : t('cardPay.waitingNote')}</p>
      <button
        type="button"
        onClick={onTryAgain}
        className="min-h-[44px] px-5 rounded-lg text-on-surface-variant font-label-md hover:text-savanna-green transition-colors"
      >
        {t('cardPay.cancel')}
      </button>
    </div>
  )
}
