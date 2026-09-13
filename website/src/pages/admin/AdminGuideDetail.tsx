import { Link, useParams } from 'react-router-dom'
import { Star, CaretRight, ChatCircleDots, ArrowLeft } from '@phosphor-icons/react'
import { getGuide } from '../../api/guides'
import { getBookings, STAGE_LABELS } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'

export function AdminGuideDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: guide, loading: guideLoading, error: guideError } = useFetch(() => getGuide(id!), [id])
  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetch(
    () => getBookings({ guide: Number(id) }),
    [id],
  )

  if (guideLoading || bookingsLoading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (guideError || !guide) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">Staff member not found.</p>
        <Link to="/admin/guides" className="text-savanna-green font-label-md">
          Back to Staff & Guides
        </Link>
      </div>
    )
  }

  const allBookings = bookings ?? []
  const activeBookings = allBookings.filter((b) => b.stage !== 'completed' && b.stage !== 'new_inquiry')
  const upcomingBookings = allBookings.filter((b) => b.stage === 'confirmed' || b.stage === 'quoted')
  const currentTrip = activeBookings[0]

  return (
    <div>
      <Link to="/admin/guides" className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green text-sm mb-4">
        <ArrowLeft size={16} />
        Back to Staff &amp; Guides
      </Link>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center font-headline-md text-xl text-on-surface-variant border-2 border-sand-stone shrink-0">
          {guide.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-headline-md text-[24px] text-on-surface">{guide.name}</h2>
          <p className="text-on-surface-variant text-sm">
            {guide.role} &bull; {guide.status}
          </p>
        </div>
        <div className="flex items-center gap-1 text-golden-sun bg-surface-container-low rounded-lg px-4 py-2">
          <Star size={20} weight="fill" />
          <span className="font-headline-md text-on-surface">{guide.rating}</span>
        </div>
      </div>

      {(guideError || bookingsError) && <p className="text-error text-sm mb-6">{bookingsError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider">Current Trip Tracking</h3>
              {currentTrip && (
                <span className="bg-savanna-green/10 text-savanna-green px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-savanna-green rounded-full animate-pulse" />
                  In Progress
                </span>
              )}
            </div>

            {!currentTrip && <p className="text-on-surface-variant text-sm">No active trip right now.</p>}

            {currentTrip && (
              <div className="bg-surface-container-low rounded-xl p-4 border border-sand-stone/50">
                <p className="font-body-md text-on-surface font-semibold mb-1">
                  Booking #{currentTrip.id} &middot; {currentTrip.customerName}
                </p>
                <p className="font-label-sm text-on-surface-variant mb-2">
                  {currentTrip.packageTitle} &bull; {currentTrip.startDate} – {currentTrip.endDate}
                </p>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-label-sm bg-surface-container text-on-surface">
                  {STAGE_LABELS[currentTrip.stage]}
                </span>
              </div>
            )}
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider mb-4">Upcoming Assignments</h3>
            <div className="space-y-3">
              {upcomingBookings.length === 0 && <p className="text-on-surface-variant text-sm">No upcoming assignments.</p>}
              {upcomingBookings.map((b) => (
                <Link
                  key={b.id}
                  to={`/admin/inquiries/${b.id}`}
                  className="flex items-center gap-4 bg-surface-container p-3 rounded-lg hover:bg-surface-container-high transition-colors border border-transparent hover:border-sand-stone"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-sm text-on-surface font-bold truncate">{b.packageTitle}</p>
                    <p className="font-label-sm text-on-surface-variant text-xs">
                      {b.customerName} &bull; {b.startDate} – {b.endDate}
                    </p>
                  </div>
                  <CaretRight size={16} className="text-on-surface-variant shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider">Recent Reviews</h3>
            <ChatCircleDots size={18} className="text-on-surface-variant" />
          </div>
          <p className="text-on-surface-variant text-sm">
            Individual guest reviews aren&apos;t recorded yet — only the aggregate rating above is tracked.
          </p>
        </section>
      </div>
    </div>
  )
}
