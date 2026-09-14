import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, PaperPlaneTilt, SealCheck, Star, UserCircle } from '@phosphor-icons/react'
import { getBooking, submitReview } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

function StarPicker({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n !== 1 ? 's' : ''}`}>
          <Star
            size={size}
            weight={n <= value ? 'fill' : 'regular'}
            className={n <= value ? 'text-golden-sun' : 'text-outline-variant'}
          />
        </button>
      ))}
    </div>
  )
}

export function RateExperience() {
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading } = useFetch(() => getBooking(Number(tripId)), [tripId])
  const navigate = useNavigate()

  const [guideRating, setGuideRating] = useState(0)
  const [overallRating, setOverallRating] = useState(0)
  const [testimonial, setTestimonial] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guideName = trip?.assignedGuideName ?? 'your guide'

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Trip Not Found</h1>
        <Link to="/account" className="text-savanna-green font-label-md">
          Back to My Trips
        </Link>
      </div>
    )
  }

  if (trip.stage !== 'completed') {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Not Available Yet</h1>
        <p className="text-on-surface-variant mb-8">Only completed trips can be rated.</p>
        <Link to="/account" className="text-savanna-green font-label-md">
          Back to My Trips
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await submitReview(Number(tripId), { guideRating, tripRating: overallRating, testimonial })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit your review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {submitted || trip.review ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-sm">
            <CheckCircle size={48} weight="fill" className="text-savanna-green mx-auto mb-4" />
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">Thank you!</h1>
            <p className="text-on-surface-variant mb-8">
              Your review helps other travelers and means a lot to {guideName}.
            </p>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="min-h-[44px] bg-savanna-green text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-opacity"
            >
              Back to My Trips
            </button>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="text-center">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                How was your safari?
              </h1>
              <p className="text-on-surface-variant">
                Thank you for choosing Pande Wilderness Safari. We'd love to hear about your adventure!
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-full bg-surface-container flex items-center justify-center border-4 border-surface-container-low shadow-sm text-on-surface-variant/50">
                    <UserCircle size={64} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-savanna-green text-on-primary p-2 rounded-full shadow-sm">
                    <SealCheck size={14} weight="fill" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <span className="font-label-sm text-label-sm text-terracotta uppercase tracking-wider">
                    Your Lead Guide
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{guideName}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">
                    How would you rate {guideName.split(' ')[0]}'s knowledge, hospitality, and overall guidance
                    during your trip?
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-on-surface-variant text-xs">Tap to rate</span>
                  <StarPicker value={guideRating} onChange={setGuideRating} />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center gap-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Overall Experience</h3>
              <p className="text-on-surface-variant text-sm">
                From booking to departure, how was your journey with Pande Wilderness?
              </p>
              <StarPicker value={overallRating} onChange={setOverallRating} size={36} />
            </div>

            <div>
              <label htmlFor="testimonial" className="block font-label-md text-label-md text-on-surface mb-2">
                Share Your Memories
              </label>
              <p className="text-on-surface-variant text-sm mb-3">
                Tell us about your favorite moments, any feedback for improvement, or a testimonial we can share.
              </p>
              <textarea
                id="testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                rows={5}
                required
                placeholder="The sunrise over the Serengeti was..."
                className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guideRating === 0 || overallRating === 0 || submitting}
                className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-4 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
                <PaperPlaneTilt size={18} />
              </button>
            </div>
          </form>
        )}
    </div>
  )
}
