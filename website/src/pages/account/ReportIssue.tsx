import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { getBooking } from '../../api/bookings'
import { createTicket } from '../../api/support'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

export function ReportIssue() {
  const { t } = useTranslation('account')
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading } = useFetch(() => getBooking(Number(tripId)), [tripId])
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">{t('reportIssue.loading')}</div>
  }

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('reportIssue.tripNotFound')}</h1>
        <Link to="/account" className="text-savanna-green font-label-md">
          {t('reportIssue.backToMyTrips')}
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trip) return
    setError(null)
    setSubmitting(true)
    try {
      await createTicket({ booking: trip.id, description, photo: photo || undefined })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('reportIssue.failedToSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="max-w-3xl">
        {submitted ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-sm">
            <CheckCircle size={48} weight="fill" className="text-savanna-green mx-auto mb-4" />
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">{t('reportIssue.reportSubmitted')}</h1>
            <p className="text-on-surface-variant mb-8">
              {t('reportIssue.reportSubmittedBody')}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/account/trips/${trip.id}`)}
              className="min-h-[44px] bg-savanna-green text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-opacity"
            >
              {t('reportIssue.backToTrip')}
            </button>
          </div>
        ) : (
          <>
            <Link
              to={`/account/trips/${trip.id}`}
              className="inline-flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6 hover:text-savanna-green transition-colors"
            >
              <ArrowLeft size={16} />
              {t('reportIssue.backToTrip')}
            </Link>

            <div className="mb-8">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                {t('reportIssue.guestSupport')}
              </h1>
              <p className="text-on-surface-variant">
                {t('reportIssue.intro')}
              </p>
            </div>

            <div className="bg-surface-container-low rounded-lg p-6 mb-8 border border-surface-container-high flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('reportIssue.trip')}
                </div>
                <div className="font-headline-md text-[18px] text-on-surface">{trip.packageTitle}</div>
              </div>
              {trip.assignedGuideName && (
                <>
                  <div className="hidden sm:block w-px h-10 bg-surface-container-highest" />
                  <div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      {t('reportIssue.guide')}
                    </div>
                    <div className="text-on-surface">{trip.assignedGuideName}</div>
                  </div>
                </>
              )}
            </div>

            <form
              className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-10 shadow-sm space-y-8"
              onSubmit={handleSubmit}
            >
              <div>
                <label htmlFor="issue-description" className="block font-label-md text-label-md text-on-surface mb-2">
                  {t('reportIssue.tellUsWhatWentWrong')}
                </label>
                <textarea
                  id="issue-description"
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('reportIssue.descriptionPlaceholder')}
                  className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
                />
              </div>

              <div>
                <label htmlFor="issue-photo" className="block font-label-md text-label-md text-on-surface mb-2">
                  {t('reportIssue.optionalPhotoUrl')}
                </label>
                <input
                  id="issue-photo"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-surface-variant/30">
                <div className="flex items-start gap-3 flex-1">
                  <ShieldCheck size={20} className="text-golden-sun mt-0.5 shrink-0" />
                  <p className="text-on-surface-variant text-sm">
                    {t('reportIssue.reassurance')}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary px-8 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting ? t('reportIssue.submitting') : t('reportIssue.submitReport')}
                  <PaperPlaneTilt size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
