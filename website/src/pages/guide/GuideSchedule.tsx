import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarBlank, CalendarCheck, CaretRight, CheckCircle } from '@phosphor-icons/react'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { getBookings, type Booking } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'

const FILTERS = ['Today', 'Upcoming', 'Past'] as const
type Filter = (typeof FILTERS)[number]

function tripFilter(trip: Booking, today: Date): Filter {
  const start = new Date(`${trip.startDate}T00:00:00`)
  const end = new Date(`${trip.endDate}T00:00:00`)
  if (trip.stage === 'completed' || end < today) return 'Past'
  if (start <= today && today <= end) return 'Today'
  return 'Upcoming'
}

export function GuideSchedule() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || user?.email || 'there'
  const [filter, setFilter] = useState<Filter>('Today')
  const { data: bookings, loading, error } = useFetch<Booking[]>(() => getBookings(), [])
  const trips = bookings ?? []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groups = trips.reduce<Record<Filter, Booking[]>>(
    (acc, trip) => {
      acc[tripFilter(trip, today)].push(trip)
      return acc
    },
    { Today: [], Upcoming: [], Past: [] },
  )
  const visibleTrips = groups[filter]

  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const tripsThisWeek = trips.filter((t) => {
    const start = new Date(`${t.startDate}T00:00:00`)
    return start >= today && start <= weekEnd
  }).length

  return (
    <div className="min-h-screen bg-surface-bright">
      <header className="fixed top-0 inset-x-0 h-16 z-40 flex items-center justify-between px-5 bg-surface/80 backdrop-blur-md border-b border-surface-variant/60">
        <div>
          <span className="font-headline-md text-[20px] font-bold text-savanna-green">Pande Wilderness Safari</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant -mt-0.5">Guide Portal</p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"
        >
          <Bell size={22} />
        </button>
      </header>

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="mb-6">
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Karibu, {firstName}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant/50">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CalendarCheck size={20} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Today</span>
            </div>
            <p className="font-display-lg text-2xl text-on-surface font-bold">
              {groups.Today.length} <span className="font-body-md text-body-md text-on-surface-variant font-normal">trip{groups.Today.length === 1 ? '' : 's'}</span>
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant/50">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CalendarBlank size={20} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">This Week</span>
            </div>
            <p className="font-display-lg text-2xl text-on-surface font-bold">
              {tripsThisWeek} <span className="font-body-md text-body-md text-on-surface-variant font-normal">trip{tripsThisWeek === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-full font-label-md text-label-md transition-colors ${
                filter === f ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-on-surface-variant py-12">Loading…</p>}
        {error && <p className="text-center text-error py-12">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {visibleTrips.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
                No {filter.toLowerCase()} trips.
              </p>
            )}
            {visibleTrips.map((trip) => {
              const isToday = filter === 'Today'
              const isPast = filter === 'Past'
              return (
                <Link
                  key={trip.id}
                  to={`/guide/trips/${trip.id}`}
                  className={`block bg-surface-container-lowest rounded-xl p-4 border relative overflow-hidden ${
                    isToday ? 'border-golden-sun/40 shadow-sm' : 'border-surface-variant/50'
                  } ${isPast ? 'opacity-70' : ''}`}
                >
                  {isToday && <div className="absolute top-0 left-0 w-1.5 h-full bg-golden-sun" />}
                  <div className={`flex items-start justify-between gap-3 ${isToday ? 'pl-2' : ''}`}>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm mb-2 ${
                          isPast ? 'bg-surface-container text-on-surface-variant' : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {isPast && <CheckCircle size={14} />}
                        {trip.stage.replace('_', ' ')}
                      </span>
                      <h3 className={`font-headline-md text-[20px] ${isPast ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                        {trip.packageTitle}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        {isPast ? `${trip.startDate} – ${trip.endDate}` : `${trip.customerName} party`}
                      </p>
                      {!isPast && (
                        <div className="flex items-center gap-4 mt-3 text-on-surface-variant">
                          <span className="flex items-center gap-1 font-label-sm text-label-sm">
                            <CalendarBlank size={16} />
                            {trip.startDate} – {trip.endDate}
                          </span>
                        </div>
                      )}
                    </div>
                    <CaretRight size={20} className="text-on-surface-variant mt-1 shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
