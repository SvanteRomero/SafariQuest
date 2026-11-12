import { useTranslation } from 'react-i18next'
import { HourglassMedium, Receipt } from '@phosphor-icons/react'
import { getPaymentAvailability, payForBooking, type BookingDetail } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { useCurrentLocale } from '../../i18n/useLocale'
import { formatMoney } from '../../lib/money'
import { useTripPayButtonProps } from '../../lib/useTripPayButtonProps'
import { TripPayButton } from '../checkout/TripPayButton'
import { PaymentOutageNotice } from '../checkout/PaymentOutageNotice'

const DEPOSIT_RATE = 0.3

/**
 * The quote an admin prepared for a trip-planner request, in the tourist's own account —
 * where they read it and pay its deposit. Before the quote is sent it says one is being
 * prepared; once the deposit is paid it stays as a record of what was agreed.
 */
export function TripQuote({ trip, onPaid }: Readonly<{ trip: BookingDetail; onPaid: () => void }>) {
  const { t, i18n } = useTranslation('account')
  const locale = useCurrentLocale()
  const { data: availability } = useFetch(getPaymentAvailability, [])
  const payButtonProps = useTripPayButtonProps(availability)
  const money = (amount: number) => formatMoney(amount, i18n.language, trip.currency)

  if (trip.stage === 'new_inquiry' && trip.quoteRequested) {
    return (
      <div className="bg-golden-sun/10 border border-golden-sun/40 rounded-xl p-6 md:p-8 flex gap-4">
        <HourglassMedium size={28} className="text-golden-sun shrink-0" />
        <div>
          <h3 className="font-headline-md text-[20px] text-on-surface mb-1">{t('quote.preparingHeading')}</h3>
          <p className="text-on-surface-variant">{t('quote.preparingBody')}</p>
        </div>
      </div>
    )
  }
  if (trip.lineItems.length === 0) return null

  const total = trip.lineItems.reduce((sum, item) => sum + item.quotePrice, 0)
  const depositDue = trip.depositDue
  // The server's deposit includes any referral discount; 30% of the total is without it.
  const discounted = depositDue !== null && depositDue < Math.round(total * DEPOSIT_RATE)

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant">
      <div className="flex items-center gap-3 mb-6">
        <Receipt size={26} className="text-savanna-green" />
        <h3 className="font-headline-md text-headline-md text-on-surface">{t('quote.heading')}</h3>
      </div>
      {depositDue !== null && <p className="text-on-surface-variant mb-6">{t('quote.readyBody')}</p>}

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="text-left text-on-surface-variant border-b border-sand-stone">
            <th className="py-2 font-label-sm">{t('quote.item')}</th>
            <th className="py-2 font-label-sm text-right">{t('quote.qty')}</th>
            <th className="py-2 font-label-sm text-right">{t('quote.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {trip.lineItems.map((item, i) => (
            <tr key={`${item.label}-${i}`} className="border-b border-sand-stone/60">
              <td className="py-3 text-on-surface">{item.label}</td>
              <td className="py-3 text-right text-on-surface-variant">
                {item.quantity} × {money(item.unitPrice)}
              </td>
              <td className="py-3 text-right text-on-surface">{money(item.quotePrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="pt-4 font-label-md text-on-surface">
              {t('quote.total')}
            </td>
            <td className="pt-4 text-right font-headline-md text-[22px] text-savanna-green">{money(total)}</td>
          </tr>
        </tfoot>
      </table>

      {depositDue !== null && (
        <>
          <div className="flex justify-between items-baseline bg-savanna-green/5 border border-savanna-green/20 rounded-lg p-4 mb-4">
            <span className="font-label-md text-on-surface">
              {discounted ? t('quote.depositDueDiscounted') : t('quote.depositDue')}
            </span>
            <span className="font-headline-md text-[20px] text-terracotta">{money(depositDue)}</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">{t('quote.balanceLater')}</p>
          {trip.currency === 'TZS' && (
            <div className="mb-4">
              <PaymentOutageNotice availability={availability} />
            </div>
          )}
          <TripPayButton
            bookingId={trip.id}
            label={t('quote.payDeposit', { amount: money(depositDue) })}
            {...payButtonProps(trip.currency)}
            start={(options) => payForBooking(trip.id, locale, options)}
            onPaid={onPaid}
          />
        </>
      )}
    </div>
  )
}
