import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, CalendarBlank, NotePencil, ShieldCheck, PencilSimple, ArrowRight } from '@phosphor-icons/react'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { usePlanSelections } from '../../components/plan/usePlanSelections'
import { useAuth } from '../../auth/AuthContext'

export function PlanReview() {
  const { t } = useTranslation('plan')
  const { plan, setContactName, setContactEmail, setContactPhone } = useTripPlan()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    loading: experiencesLoading,
    selectedDestinations,
    selectedExperiences,
    hasPrimaryProduct,
  } = usePlanSelections()

  const travelers = plan.adults + plan.children

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // The actual booking (with its one primary product — everything else selected folds
    // into the message) is only created once payment succeeds, on the Payment step —
    // this step just confirms the trip details and collects contact info for it.
    navigate(user ? '/plan/payment' : '/plan/account')
  }

  const canContinue = hasPrimaryProduct && Boolean(plan.travelDates)

  if (user && user.role !== 'tourist') {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
          Sign In Required
        </h2>
        <p className="text-on-surface-variant mb-8">
          You're signed in with a {user.role.replace('_', ' ')} account, which can't make bookings. Sign out and
          continue as a tourist (or without an account) to book this trip.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          {t('review.heading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t('review.subtitle')}
        </p>
        {!experiencesLoading && !canContinue && (
          <p className="text-error text-sm mt-3">
            {!hasPrimaryProduct ? t('review.selectAtLeastOne') : t('review.chooseStartDate')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
            <h3 className="font-headline-md text-[20px] text-on-surface mb-5 flex items-center gap-3">
              <MapPin size={22} className="text-savanna-green" />
              {t('review.destinationsExperiences')}
            </h3>
            <div className="space-y-4 mb-6">
              {selectedDestinations.map((d) => (
                <div key={d.id} className="flex gap-4 items-center pb-4 border-b border-sand-stone last:border-0 last:pb-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                    <img src={d.images[0]} alt={d.imageAlt} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface text-[16px] mb-1">{d.name}</p>
                    <p className="text-on-surface-variant text-sm">{d.highlight}</p>
                  </div>
                </div>
              ))}
            </div>
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
              {t('review.selectedExperiences')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedExperiences.map((e) => (
                <span key={e.id} className="bg-surface-container text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full">
                  {e.title}
                </span>
              ))}
              {selectedExperiences.length === 0 && (
                <p className="text-on-surface-variant text-sm">{t('review.noExperiencesSelected')}</p>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
            <h3 className="font-headline-md text-[20px] text-on-surface mb-5 flex items-center gap-3">
              <CalendarBlank size={22} className="text-savanna-green" />
              {t('review.tripLogistics')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t('review.days')}</p>
                <p className="font-label-md text-on-surface">{plan.days}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('review.travelDates')}
                </p>
                <p className="font-label-md text-on-surface">{plan.travelDates || t('review.notSet')}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('review.travelersLabel')}
                </p>
                <p className="font-label-md text-on-surface">
                  {travelers} ({t('travelers.adults', { count: plan.adults })}
                  {plan.children > 0 ? `, ${t('travelers.children', { count: plan.children })}` : ''})
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{t('review.style')}</p>
                <p className="font-label-md text-on-surface">{t(`details.tiers.${plan.accommodationTier}.title`)}</p>
              </div>
            </div>
          </section>

          {plan.notes && (
            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
              <h3 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-3">
                <NotePencil size={22} className="text-savanna-green" />
                {t('review.yourNotes')}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-savanna-green pl-4">
                &ldquo;{plan.notes}&rdquo;
              </p>
            </section>
          )}

          <button
            type="button"
            onClick={() => navigate('/plan/details')}
            className="self-start inline-flex items-center gap-2 text-terracotta font-label-md text-label-md hover:opacity-80 transition-opacity"
          >
            <PencilSimple size={18} />
            {t('review.editSelections')}
          </button>
        </div>

        <aside className="lg:col-span-2 lg:sticky lg:top-8">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-5"
          >
            <div>
              <h3 className="font-headline-md text-[20px] text-on-surface mb-1">{t('review.yourDetails')}</h3>
              <p className="font-body-md text-sm text-on-surface-variant">{t('review.whereToSend')}</p>
            </div>
            <div>
              <label htmlFor="review-name" className="block font-label-sm text-label-sm text-on-surface mb-2">
                {t('review.fullName')}
              </label>
              <input
                id="review-name"
                type="text"
                required
                value={plan.contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('review.fullNamePlaceholder')}
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="review-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                {t('review.email')}
              </label>
              <input
                id="review-email"
                type="email"
                required
                value={plan.contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="review-phone" className="block font-label-sm text-label-sm text-on-surface mb-2">
                {t('review.phoneWhatsApp')}
              </label>
              <div className="flex gap-2">
                <select
                  aria-label={t('review.countryCode')}
                  defaultValue="+255"
                  className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-3 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                >
                  <option>+255</option>
                  <option>+1</option>
                  <option>+44</option>
                </select>
                <input
                  id="review-phone"
                  type="tel"
                  required
                  value={plan.contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(000) 000-0000"
                  className="flex-1 min-w-0 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-lg">
              <ShieldCheck size={20} className="text-golden-sun shrink-0 mt-0.5" />
              <p className="font-body-md text-[13px] text-on-surface-variant">
                <strong className="text-on-surface">{t('review.depositSecures')}</strong>{' '}
                {user ? t('review.nextPayDeposit') : t('review.nextCreateAccountPayDeposit')}
              </p>
            </div>

            <button
              type="submit"
              disabled={experiencesLoading || !canContinue}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-4 rounded-lg font-label-md text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t('review.continue')}
              <ArrowRight size={18} weight="bold" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
