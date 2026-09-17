import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, CheckCircle, Clock, ClockCounterClockwise, MapPin, CreditCard } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { getBookings, payRemainingBalance, type Booking, type BookingStage } from '../../api/bookings'
import { getMyInvoices } from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const BADGE: Record<BookingStage, { className: string; icon: ComponentType<{ size?: number; weight?: 'fill' }> }> = {
  new_inquiry: { className: 'bg-surface-tint text-on-primary', icon: CheckCircle },
  quoted: { className: 'bg-golden-sun text-on-surface', icon: Clock },
  deposit_paid: { className: 'bg-golden-sun text-on-surface', icon: Clock },
  confirmed: { className: 'bg-surface-tint text-on-primary', icon: CheckCircle },
  completed: { className: 'bg-outline text-on-tertiary', icon: ClockCounterClockwise },
}

export function MyTrips() {
  const { t } = useTranslation('account')
  const { data: bookings, loading, error, refetch: refetchBookings } = useFetch<Booking[]>(() => getBookings(), [])
  const { data: invoices, refetch: refetchInvoices } = useFetch(getMyInvoices, [])
  const trips = bookings ?? []
  const [payingId, setPayingId] = useState<number | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

  async function handlePayBalance(bookingId: number) {
    setPayError(null)
    setPayingId(bookingId)
    try {
      await payRemainingBalance(bookingId)
      refetchInvoices()
      refetchBookings()
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPayingId(null)
    }
  }

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
      {payError && (
        <p role="alert" className="text-error font-label-sm text-label-sm mb-6">
          {payError}
        </p>
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
                      {Boolean(remainingBalance) && (
                        <button
                          type="button"
                          onClick={() => handlePayBalance(trip.id)}
                          disabled={payingId === trip.id}
                          className="w-full mb-2 inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <CreditCard size={18} weight="bold" />
                          {payingId === trip.id
                            ? 'Processing…'
                            : `Pay Remaining Balance ($${remainingBalance!.toLocaleString()})`}
                        </button>
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
