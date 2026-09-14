import { Link, useParams } from 'react-router-dom'
import { CalendarBlank, EnvelopeSimple, UsersThree, CheckCircle } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { getBooking, STAGE_LABELS } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'

export function GuideTripDetail() {
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading, error } = useFetch(() => getBooking(Number(tripId)), [tripId])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Trip Detail" showBack />
        <main className="pt-24 pb-28 px-5 max-w-lg mx-auto text-center text-on-surface-variant">Loading…</main>
        <GuideBottomNav active="schedule" />
      </div>
    )
  }

  // error wasn't checked here before — a failed fetch (network error, or a
  // trip not assigned to this guide) fell through to the same UI as a
  // genuinely missing trip. Same convention account/TripProgress.tsx already
  // uses for the customer-facing equivalent of this page.
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Trip Detail" showBack />
        <main className="pt-24 pb-28 px-5 max-w-lg mx-auto text-center">
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">Trip not found.</p>
          <Link to="/guide" className="text-savanna-green font-label-md text-label-md">
            Back to Schedule
          </Link>
        </main>
        <GuideBottomNav active="schedule" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="Trip Detail" showBack />

      <main className="pt-20 pb-40 px-5 max-w-lg mx-auto min-h-screen">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary-container/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
            <span className="font-label-sm text-label-sm">{STAGE_LABELS[trip.stage]}</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">{trip.packageTitle}</h2>
          <div className="flex items-center gap-4 mt-2 text-on-surface-variant">
            <span className="flex items-center gap-1 font-label-sm text-label-sm">
              <CalendarBlank size={16} />
              {trip.startDate} – {trip.endDate}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Guest Party</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant shrink-0">
              {trip.customerName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-label-md text-on-surface">{trip.customerName}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <UsersThree size={14} /> {trip.guests} guest{trip.guests === 1 ? '' : 's'}
              </p>
            </div>
            <a
              href={`mailto:${trip.customerEmail}`}
              aria-label="Email guest"
              className="p-2.5 rounded-full bg-surface-container text-primary hover:bg-surface-container-high transition-colors"
            >
              <EnvelopeSimple size={20} />
            </a>
          </div>
          {trip.message && (
            <div className="mt-4 pt-4 border-t border-surface-variant">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                Guest Message
              </p>
              <p className="font-body-md text-body-md text-on-surface">{trip.message}</p>
            </div>
          )}
        </div>

        {trip.milestones.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
            <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Itinerary</h3>
            <div className="space-y-2">
              {trip.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      m.status === 'completed'
                        ? 'bg-savanna-green'
                        : m.status === 'current'
                          ? 'bg-golden-sun'
                          : 'bg-outline-variant'
                    }`}
                  />
                  <span
                    className={
                      m.status === 'upcoming' ? 'text-on-surface-variant' : 'font-label-md text-on-surface'
                    }
                  >
                    Day {m.day}: {m.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Logistics</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Vehicle assignment, pickup point, and permit tracking aren&apos;t set up yet — coordinate those details
            directly with the operations team.
          </p>
        </div>
      </main>

      <div className="fixed bottom-16 inset-x-0 z-30 px-5 py-3 bg-gradient-to-t from-surface-bright via-surface-bright/95 to-transparent">
        <Link
          to={`/guide/trips/${trip.id}/progress`}
          className="max-w-lg mx-auto w-full flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-3.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors"
        >
          <CheckCircle size={20} />
          Update Trip Progress
        </Link>
      </div>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
