import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { CheckCircle, PaperPlaneTilt, SealCheck, Star, UserCircle } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { getBooking, submitReview } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

function StarPicker({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const { t } = useTranslation('account')
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={t('rateExperience.starRating', { count: n })}>
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
  const { t } = useTranslation('account')
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading } = useFetch(() => getBooking(Number(tripId)), [tripId])
  const navigate = useNavigate()

  const [guideRating, setGuideRating] = useState(0)
  const [overallRating, setOverallRating] = useState(0)
  const [testimonial, setTestimonial] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guideName = trip?.assignedGuideName ?? t('rateExperience.yourGuide')

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">{t('rateExperience.loading')}</div>
  }

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('rateExperience.tripNotFound')}</h1>
        <Link to="/account" className="text-savanna-green font-label-md">
          {t('rateExperience.backToMyTrips')}
        </Link>
      </div>
    )
  }

  if (trip.stage !== 'completed') {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('rateExperience.notAvailableYet')}</h1>
        <p className="text-on-surface-variant mb-8">{t('rateExperience.onlyCompletedTrips')}</p>
        <Link to="/account" className="text-savanna-green font-label-md">
          {t('rateExperience.backToMyTrips')}
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
      setError(err instanceof ApiError ? err.message : t('rateExperience.failedToSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {submitted || trip.review ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-sm">
            <CheckCircle size={48} weight="fill" className="text-savanna-green mx-auto mb-4" />
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">{t('rateExperience.thankYou')}</h1>
            <p className="text-on-surface-variant mb-8">
              {t('rateExperience.thankYouBody', { guideName })}
            </p>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="min-h-[44px] bg-savanna-green text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-opacity"
            >
              {t('rateExperience.backToMyTrips')}
            </button>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="text-center">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                {t('rateExperience.howWasYourSafari')}
              </h1>
              <p className="text-on-surface-variant">
                {t('rateExperience.intro')}
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
                    {t('rateExperience.yourLeadGuide')}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{guideName}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">
                    {t('rateExperience.guideRatingPrompt', { firstName: guideName.split(' ')[0] })}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-on-surface-variant text-xs">{t('rateExperience.tapToRate')}</span>
                  <StarPicker value={guideRating} onChange={setGuideRating} />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center gap-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">{t('rateExperience.overallExperience')}</h3>
              <p className="text-on-surface-variant text-sm">
                {t('rateExperience.overallRatingPrompt')}
              </p>
              <StarPicker value={overallRating} onChange={setOverallRating} size={36} />
            </div>

            <div>
              <label htmlFor="testimonial" className="block font-label-md text-label-md text-on-surface mb-2">
                {t('rateExperience.shareYourMemories')}
              </label>
              <p className="text-on-surface-variant text-sm mb-3">
                {t('rateExperience.memoriesPrompt')}
              </p>
              <textarea
                id="testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                rows={5}
                required
                placeholder={t('rateExperience.testimonialPlaceholder')}
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
                {submitting ? t('rateExperience.submitting') : t('rateExperience.submitReview')}
                <PaperPlaneTilt size={18} />
              </button>
            </div>
          </form>
        )}
    </div>
  )
}
