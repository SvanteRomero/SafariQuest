import { useEffect, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, CheckCircle, Clock, ClockCounterClockwise, MapPin, Receipt } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { getBookings, getPaymentAvailability, payForBooking, payRemainingBalance, type Booking, type BookingStage, type PaymentStatusValue } from '../../api/bookings'
import { getMyInvoices } from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { useCurrentLocale } from '../../i18n/useLocale'
import { paymentReturnParams, usePaymentStatus } from '../../lib/usePaymentStatus'
import { PaymentOutageNotice } from '../../components/checkout/PaymentOutageNotice'
import { TripPayButton } from '../../components/checkout/TripPayButton'
import { formatMoney } from '../../lib/money'
import { useTripPayButtonProps } from '../../lib/useTripPayButtonProps'

const BADGE: Record<BookingStage, { className: string; icon: ComponentType<{ size?: number; weight?: 'fill' }> }> = {
  new_inquiry: { className: 'bg-surface-tint text-on-primary', icon: CheckCircle },
  quoted: { className: 'bg-golden-sun text-on-surface', icon: Clock },
  deposit_paid: { className: 'bg-golden-sun text-on-surface', icon: Clock },
  confirmed: { className: 'bg-surface-tint text-on-primary', icon: CheckCircle },
  completed: { className: 'bg-outline text-on-tertiary', icon: ClockCounterClockwise },
}

/** What to tell a tourist who has just come back from Snippe's checkout after paying a balance. */
function returnBannerText(status: PaymentStatusValue | undefined, gaveUp: boolean, card: boolean): string {
  if (status === 'completed') return 'Payment received — thank you! Your trip has been updated.'
  if (status === 'failed' || status === 'expired') {
    return "That payment didn't go through, so nothing was charged. You can try again below."
  }
  if (gaveUp) return "We haven't had confirmation yet. If you approved the payment it will show here shortly."
  if (card) return 'Confirming your card payment…'
  return "Confirming your payment… approve the prompt on your phone if you haven't yet."
}

/** Whether a trip card offers "Pay Deposit" straight away: a checkout booking whose
 * payment never completed. A sent quote is paid from the trip page, where the quote is
 * shown; a trip-planner request still being quoted has nothing to pay. */
function checkoutDepositDue(trip: Booking, hasInvoice: boolean, invoicesLoaded: boolean): boolean {
  return trip.stage === 'new_inquiry' && invoicesLoaded && !hasInvoice && !trip.quoteRequested
}

export function MyTrips() {
  const { t, i18n } = useTranslation('account')
  const { data: bookings, loading, error, refetch: refetchBookings } = useFetch<Booking[]>(() => getBookings(), [])
  const { data: invoices, refetch: refetchInvoices } = useFetch(getMyInvoices, [])
  const { data: paymentAvailability } = useFetch(getPaymentAvailability, [])
  const trips = bookings ?? []
  const locale = useCurrentLocale()
  // Snippe's checkout sends the tourist back here with ?booking=&payment= after a balance payment.
  const location = useLocation()
  const { bookingId: returnedBookingId, paymentId: returnedPaymentId } = paymentReturnParams(location.search)
  const { payment: returnedPayment, gaveUp } = usePaymentStatus(returnedBookingId, returnedPaymentId)
  const returnedStatus = returnedPayment?.status

  useEffect(() => {
    if (returnedStatus === 'completed') {
      refetchInvoices()
      refetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedStatus])

  const tripPayButtonProps = useTripPayButtonProps(paymentAvailability)
  const payButtonProps = (trip: Booking) => tripPayButtonProps(trip.currency)

  function handlePaid() {
    refetchInvoices()
    refetchBookings()
  }

  const returnBanner = returnedPaymentId === null ? null : returnBannerText(returnedStatus, gaveUp, returnedPayment?.mode === 'card')

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">{t('myTrips.heading')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          {t('myTrips.subtitle')}
        </p>
      </div>

      {loading && <p className="text-on-surface-variant">{t('myTrips.loading')}</p>}
      {error && <p className="text-error">{error}</p>}
      {returnBanner && (
        <p role="status" aria-live="polite" className="font-label-md text-label-md text-on-surface bg-savanna-green/10 border border-savanna-green/20 rounded-xl p-4 mb-6">
          {returnBanner}
        </p>
      )}
      {trips.some((trip) => trip.stage === 'new_inquiry' || trip.stage === 'quoted' || trip.stage === 'deposit_paid') && (
        <div className="mb-6">
          <PaymentOutageNotice availability={paymentAvailability} />
        </div>
      )}

      {!loading && !error && (
        <>
          {trips.length === 0 ? (
            <p className="text-on-surface-variant">{t('myTrips.empty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {trips.map((trip) => {
                const badge = BADGE[trip.stage]
                const BadgeIcon = badge.icon
                const isCompleted = trip.stage === 'completed'
                const invoice = (invoices ?? []).find((i) => i.bookingId === trip.id)
                const remainingBalance = invoice?.remainingBalance
                const depositDue = checkoutDepositDue(trip, Boolean(invoice), invoices !== null)
                const awaitingQuote = trip.stage === 'new_inquiry' && trip.quoteRequested
                return (
                  <div
                    key={trip.id}
                    className={`group relative rounded-xl overflow-hidden ambient-shadow shadow-[0_4px_20px_rgba(45,45,45,0.06)] transition-transform hover:-translate-y-1 duration-300 flex flex-col ${
                      isCompleted ? 'bg-surface-container-low' : 'bg-ivory-base'
                    }`}
                  >
                    <div className="h-32 relative w-full overflow-hidden bg-surface-container flex items-center justify-center">
                      <MapPin size={32} className="text-on-surface-variant/40" />
                      <div
                        className={`absolute top-4 right-4 px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm ${badge.className}`}
                      >
                        <BadgeIcon size={14} weight="fill" />
                        {t(`stageLabels.${trip.stage}`)}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-headline-md text-[24px] leading-tight text-on-surface mb-2">{trip.packageTitle}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md mb-4">
                        <CalendarBlank size={18} weight="fill" className="text-savanna-green shrink-0" />
                        <span>
                          {trip.startDate} – {trip.endDate}
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface-variant/80 text-sm mb-4 flex-1">
                        {trip.assignedGuideName ? t('myTrips.guideAssigned', { name: trip.assignedGuideName }) : t('myTrips.guideNotAssigned')}
                      </p>
                      {awaitingQuote && (
                        <p className="text-sm text-on-surface bg-golden-sun/15 border border-golden-sun/40 rounded-lg p-3 mb-3">
                          {t('quote.preparingShort')}
                        </p>
                      )}
                      {trip.depositDue !== null && (
                        <div className="mb-2 space-y-2">
                          <p className="text-sm text-on-surface bg-savanna-green/10 border border-savanna-green/20 rounded-lg p-3">
                            {t('quote.readyShort', { amount: formatMoney(trip.depositDue, i18n.language, trip.currency) })}
                          </p>
                          <Link
                            to={`/account/trips/${trip.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
                          >
                            <Receipt size={18} weight="bold" />
                            {t('quote.viewAndPay')}
                          </Link>
                        </div>
                      )}
                      {depositDue && (
                        <TripPayButton
                          bookingId={trip.id}
                          label="Pay Deposit"
                          {...payButtonProps(trip)}
                          start={(options) => payForBooking(trip.id, locale, options)}
                          onPaid={handlePaid}
                        />
                      )}
                      {Boolean(remainingBalance) && (
                        <TripPayButton
                          bookingId={trip.id}
                          label={`Pay Remaining Balance (${formatMoney(remainingBalance!, undefined, trip.currency)})`}
                          {...payButtonProps(trip)}
                          start={(options) => payRemainingBalance(trip.id, locale, options)}
                          onPaid={handlePaid}
                        />
                      )}
                      <Link
                        to={`/account/trips/${trip.id}`}
                        className="w-full mt-auto bg-savanna-green text-on-primary py-3 rounded-lg font-label-md hover:bg-primary-container transition-colors text-center"
                      >
                        {t('myTrips.viewDetails')}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
