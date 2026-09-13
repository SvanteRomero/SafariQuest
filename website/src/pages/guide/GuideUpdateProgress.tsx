import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, MapPin, Lock, CheckCircle, ClockCounterClockwise } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { getBooking, completeMilestone, STAGE_LABELS } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

export function GuideUpdateProgress() {
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading, refetch } = useFetch(() => getBooking(Number(tripId)), [tripId])
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Update Progress" showBack />
        <main className="pt-24 pb-28 px-5 max-w-lg mx-auto text-center text-on-surface-variant">Loading…</main>
        <GuideBottomNav active="schedule" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Update Progress" showBack />
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

  async function handleMarkComplete(milestoneId: number) {
    setError(null)
    setSubmitting(true)
    try {
      await completeMilestone(Number(tripId), milestoneId, { note: note || undefined, photo: photo || undefined })
      setNote('')
      setPhoto('')
      refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark this stop complete.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="Update Progress" showBack />

      <main className="pt-20 pb-40 px-5 max-w-lg mx-auto min-h-screen">
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-2">{trip.packageTitle}</p>
        <span className="inline-block mb-6 px-3 py-1 rounded-full text-xs font-label-sm bg-surface-container text-on-surface">
          {STAGE_LABELS[trip.stage]}
        </span>

        {trip.milestones.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-variant/50 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
              <ClockCounterClockwise size={26} className="text-on-surface-variant" />
            </div>
            <h3 className="font-headline-md text-[18px] text-on-surface mb-2">No itinerary set for this trip</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">
              This safari package has no day-by-day itinerary to track. Coordinate live updates with the operations
              team directly for now.
            </p>
          </div>
        ) : (
          <div className="relative pl-5 space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-0.5 before:bg-outline-variant before:z-0">
            {trip.milestones.map((milestone) => {
              if (milestone.status === 'completed') {
                return (
                  <div key={milestone.id} className="relative z-10 flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-savanna-green flex items-center justify-center shadow-sm relative z-10 mt-0.5">
                      <Check size={18} weight="bold" className="text-on-primary" />
                    </div>
                    <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-surface-variant/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-label-md text-on-surface">
                          Day {milestone.day}: {milestone.title}
                        </h4>
                      </div>
                      {milestone.note && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-2">{milestone.note}</p>
                      )}
                    </div>
                  </div>
                )
              }

              if (milestone.status === 'current') {
                return (
                  <div key={milestone.id} className="relative z-10 flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-golden-sun flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] relative z-10 mt-0.5">
                      <MapPin size={18} weight="fill" className="text-on-secondary-fixed-variant" />
                    </div>
                    <div className="flex-1 bg-surface-container-lowest rounded-xl p-5 border-2 border-golden-sun shadow-sm">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary mb-2 border border-secondary-container/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
                        <span className="font-label-sm text-label-sm">Current stop</span>
                      </div>
                      <h4 className="font-headline-md text-[18px] text-on-surface">
                        Day {milestone.day}: {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{milestone.description}</p>
                      )}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Add a note about this stop (optional)"
                        className="w-full mt-3 bg-surface border border-surface-variant rounded-lg p-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        value={photo}
                        onChange={(e) => setPhoto(e.target.value)}
                        placeholder="Photo URL (optional)"
                        className="w-full mt-2 bg-surface border border-surface-variant rounded-lg p-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {error && <p className="text-error text-sm mt-2">{error}</p>}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleMarkComplete(milestone.id)}
                        className="w-full mt-3 bg-savanna-green text-on-primary py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-60"
                      >
                        <CheckCircle size={20} />
                        {submitting ? 'Saving…' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={milestone.id} className="relative z-10 flex gap-4 items-start opacity-60">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-outline-variant relative z-10 mt-0.5">
                    <Lock size={16} className="text-outline" />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h4 className="font-label-md text-on-surface-variant">
                      Day {milestone.day}: {milestone.title}
                    </h4>
                  </div>
                </div>
              )
            })}

            {trip.milestones.every((m) => m.status === 'completed') && (
              <div className="relative z-10 pl-12 -mt-2">
                <p className="font-body-md text-body-md text-savanna-green font-bold">All milestones complete for this trip.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
