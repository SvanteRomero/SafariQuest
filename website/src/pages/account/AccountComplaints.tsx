import { useTranslation } from 'react-i18next'
import { Warning, ChatCircleText } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { getBookings, type Booking } from '../../api/bookings'
import { getMyTickets, type MySupportTicket } from '../../api/support'
import { useFetch } from '../../lib/useFetch'

const STATUS_STYLES: Record<MySupportTicket['status'], string> = {
  open: 'bg-terracotta/10 text-terracotta',
  in_progress: 'bg-savanna-green/10 text-savanna-green',
  resolved: 'bg-surface-container text-on-surface-variant',
}

export function AccountComplaints() {
  const { t, i18n } = useTranslation('account')
  // This page used to render a hardcoded "No complaints filed" — it fetched
  // bookings and never asked about tickets at all, so a customer who had filed
  // a complaint was told indefinitely that they had none.
  const { data: tickets, loading, error } = useFetch<MySupportTicket[]>(() => getMyTickets(), [])
  const { data: bookings } = useFetch<Booking[]>(() => getBookings(), [])

  const trips = bookings ?? []
  const activeTrip = trips.find((t) => t.stage !== 'completed') ?? trips[0]
  const filed = tickets ?? []

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">{t('complaints.heading')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          {t('complaints.subtitle')}
        </p>
      </div>

      {loading && <p className="text-on-surface-variant py-10">{t('complaints.loading')}</p>}
      {error && <p className="text-error py-10">{error}</p>}

      {!loading && !error && filed.length > 0 && (
        <ul className="space-y-4 mb-10">
          {filed.map((ticket) => (
            <li
              key={ticket.id}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  {ticket.category && (
                    <p className="font-label-md text-on-surface">{ticket.category}</p>
                  )}
                  {ticket.bookingTitle && (
                    <p className="text-sm text-on-surface-variant">{ticket.bookingTitle}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-label-sm uppercase ${STATUS_STYLES[ticket.status]}`}
                >
                  {t(`ticketStatusLabels.${ticket.status}`)}
                </span>
              </div>
              <p className="text-on-surface-variant whitespace-pre-line">{ticket.description}</p>
              <p className="text-xs text-outline-variant mt-3">
                {t('complaints.filedOn', { date: new Date(ticket.createdAt).toLocaleDateString(i18n.language) })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && filed.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant text-center">
          <Warning size={40} className="text-terracotta mx-auto mb-4" />
          <p className="font-headline-md text-headline-md text-on-surface mb-2">{t('complaints.emptyHeading')}</p>
          <p className="text-on-surface-variant max-w-md mx-auto mb-8">
            {t('complaints.emptyBody')}
          </p>
          {activeTrip && (
            <Link
              to={`/account/trips/${activeTrip.id}/report-issue`}
              className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
            >
              <ChatCircleText size={18} />
              {t('complaints.reportAnIssue')}
            </Link>
          )}
        </div>
      )}

      {!loading && !error && filed.length > 0 && activeTrip && (
        <Link
          to={`/account/trips/${activeTrip.id}/report-issue`}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
        >
          <ChatCircleText size={18} />
          {t('complaints.reportAnotherIssue')}
        </Link>
      )}
    </div>
  )
}
