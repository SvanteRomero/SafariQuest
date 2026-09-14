import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Star, SealCheck, MapPin, Check } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { getBooking } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'

export function TripProgress() {
  const { t } = useTranslation('account')
  const { tripId } = useParams<{ tripId: string }>()
  const { data: trip, loading, error } = useFetch(() => getBooking(Number(tripId)), [tripId])

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">{t('tripProgress.loading')}</div>
  }

  if (error || !trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('tripProgress.noActiveTrip')}</h1>
        <p className="text-on-surface-variant mb-8">{t('tripProgress.noActiveTripBody')}</p>
        <Link
          to="/account"
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          {t('tripProgress.backToMyTrips')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
          {t('tripProgress.heading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{trip.packageTitle}</p>
      </div>

      {/* Assigned Guide Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-container flex items-center justify-center border-4 border-surface shadow-sm shrink-0 text-on-surface-variant/50">
          <MapPin size={36} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          {trip.assignedGuideName ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant mb-2">
                <SealCheck size={16} weight="fill" className="text-savanna-green" />
                <span className="font-label-sm text-label-sm">{t('tripProgress.certifiedGuide')}</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{trip.assignedGuideName}</h3>
            </>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('tripProgress.guideNotAssigned')}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface">{t('tripProgress.itineraryProgress')}</h3>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-label-sm bg-surface-container text-on-surface-variant">
            {t(`stageLabels.${trip.stage}`)}
          </span>
        </div>
        {trip.milestones.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t('tripProgress.noMilestones')}
          </p>
        ) : (
          <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:inset-y-0 before:left-[15px] md:before:left-[19px] before:w-0.5 before:bg-outline-variant">
            {trip.milestones.map((m) => (
              <div key={m.id} className="relative z-10 flex gap-6 md:gap-8 items-start">
                <div
                  className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative z-10 -ml-6 md:-ml-10 ${
                    m.status === 'completed'
                      ? 'bg-savanna-green shadow-sm'
                      : m.status === 'current'
                        ? 'bg-golden-sun shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-surface-container-highest border-2 border-outline-variant'
                  }`}
                >
                  {m.status === 'completed' && <Check size={18} weight="bold" className="text-on-primary" />}
                  {m.status === 'current' && <MapPin size={18} weight="fill" className="text-on-secondary-fixed-variant" />}
                </div>
                <div className={`flex-1 pb-2 ${m.status === 'upcoming' ? 'opacity-70' : ''}`}>
                  {m.status === 'current' && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary mb-2 border border-secondary-container/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
                      <span className="font-label-sm text-label-sm">{t('tripProgress.youAreHere')}</span>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
                    <h4
                      className={`font-headline-md text-[20px] md:text-[24px] ${
                        m.status === 'upcoming' ? 'text-on-surface-variant' : 'text-on-surface'
                      }`}
                    >
                      {m.title}
                    </h4>
                    <span
                      className={`font-label-sm text-label-sm ${
                        m.status === 'current' ? 'font-bold text-golden-sun' : 'text-on-surface-variant'
                      }`}
                    >
                      {t('tripProgress.day', { day: m.day })}
                    </span>
                  </div>
                  {m.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">{m.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trip.stage === 'completed' && !trip.review && (
        <Link
          to={`/account/trips/${trip.id}/rate`}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-4 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          <Star size={20} weight="fill" />
          {t('tripProgress.rateExperience')}
        </Link>
      )}
    </div>
  )
}
