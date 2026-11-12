import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { getDestinations } from '../../api/destinations'
import { getParks } from '../../api/parks'
import { getSafaris } from '../../api/safaris'
import { getRegionSafaris } from '../../api/regionSafaris'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { trackFunnelEvent } from '../../lib/funnelTracking'
import { useDisplayCurrency } from '../../lib/currencyPreference'
import { ExperienceCard } from '../../components/plan/ExperienceCard'

export function PlanExperiences() {
  const { t } = useTranslation('plan')
  const { currency } = useDisplayCurrency()
  const { plan, toggleExperience } = useTripPlan()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const handoffRegion = searchParams.get('region')

  useEffect(() => {
    trackFunnelEvent('started')
  }, [])
  const { data: destinations, loading: destinationsLoading, error: destinationsError } = useFetch(getDestinations, [])
  const { data: parks, loading: parksLoading, error: parksError } = useFetch(getParks, [])
  const { data: safaris, loading: safarisLoading, error: safarisError } = useFetch(getSafaris, [])
  const {
    data: regionSafaris,
    loading: regionSafarisLoading,
    error: regionSafarisError,
  } = useFetch(getRegionSafaris, [])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const loading = destinationsLoading || parksLoading || safarisLoading || regionSafarisLoading
  const error = destinationsError || parksError || safarisError || regionSafarisError
  const selectedDestinations = (destinations ?? []).filter((d) => plan.destinationIds.includes(d.id))

  useEffect(() => {
    if (plan.destinationIds.length === 0 && !loading) {
      void navigate('/plan')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.destinationIds.length, loading])

  // "Start Planning" on a Destination Detail page hands off with ?region=...
  // (TripPlanContext pre-selects that region) — the visitor already chose a
  // region, so every experience it offers is selected for them too, instead
  // of landing on an empty picker for a region they've already committed to.
  // Guarded by a ref rather than a plan.experienceIds dependency so this
  // fires exactly once and never fights a visitor who deselects afterward.
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (didAutoSelect.current || loading || !handoffRegion) return
    didAutoSelect.current = true
    const parksInRegion = (parks ?? []).filter((p) => p.region === handoffRegion)
    const safariIds = (safaris ?? [])
      .filter((s) => parksInRegion.some((p) => s.parks.includes(p.id)))
      .map((s) => s.id)
    const regionSafariIds = (regionSafaris ?? []).filter((s) => s.region === handoffRegion).map((s) => s.id)
    for (const id of [...safariIds, ...regionSafariIds]) {
      if (!plan.experienceIds.includes(id)) toggleExperience(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, handoffRegion, parks, safaris, regionSafaris])

  const activeDestination = selectedDestinations.find((d) => d.id === activeTab) ?? selectedDestinations[0]
  const parksForActive = (parks ?? []).filter((p) => p.region === activeDestination?.id)
  const safarisForActive = (safaris ?? []).filter((s) =>
    parksForActive.some((p) => s.parks.includes(p.id)),
  )
  const regionSafarisForActive = (regionSafaris ?? []).filter((s) => s.region === activeDestination?.id)
  const selectedCountForActive =
    safarisForActive.filter((s) => plan.experienceIds.includes(s.id)).length +
    regionSafarisForActive.filter((s) => plan.experienceIds.includes(s.id)).length

  return (
    <div>
      <div className="mb-10 max-w-2xl mx-auto text-center">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          {t('experiences.heading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t('experiences.subtitle')}
        </p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-16">{t('experiences.loading')}</p>}
      {error && <p className="text-center text-error py-16">{error}</p>}

      {!loading && !error && selectedDestinations.length > 0 && (
        <>
          <div className="flex items-center justify-center gap-2 mb-8 border-b border-sand-stone overflow-x-auto">
            {selectedDestinations.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => setActiveTab(dest.id)}
                className={`shrink-0 px-4 py-3 font-label-md text-label-sm border-b-2 transition-colors ${
                  activeTab === dest.id
                    ? 'text-savanna-green border-savanna-green font-bold'
                    : 'text-on-surface-variant border-transparent hover:text-savanna-green'
                }`}
              >
                {dest.name}
              </button>
            ))}
          </div>

          {activeDestination && (
            <div className="flex flex-col gap-12 mb-10">
              {regionSafarisForActive.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div>
                      <h3 className="font-headline-md text-[20px] text-on-surface">
                        {t('experiences.regionSafarisHeading', { name: activeDestination.name })}
                      </h3>
                      <p className="text-on-surface-variant text-sm">
                        {t('experiences.regionSafarisSubtitle', { name: activeDestination.name })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regionSafarisForActive.map((safari) => (
                      <ExperienceCard
                        key={safari.id}
                        safari={safari}
                        selected={plan.experienceIds.includes(safari.id)}
                        currency={currency}
                        onToggle={() => toggleExperience(safari.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {parksForActive.map((park) => {
                const parkSafaris = (safaris ?? []).filter((s) => s.parks.includes(park.id))
                return (
                  <div key={park.id}>
                    <div className="flex items-center gap-3 mb-4">
                      {park.images[0] && (
                        <img src={park.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <h3 className="font-headline-md text-[20px] text-on-surface">{park.name}</h3>
                        {park.highlight && <p className="text-on-surface-variant text-sm">{park.highlight}</p>}
                      </div>
                    </div>
                    {parkSafaris.length === 0 ? (
                      <p className="text-on-surface-variant text-sm">{t('experiences.noSafarisYet')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parkSafaris.map((safari) => (
                          <ExperienceCard
                            key={safari.id}
                            safari={safari}
                            selected={plan.experienceIds.includes(safari.id)}
                            currency={currency}
                            onToggle={() => toggleExperience(safari.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {parksForActive.length === 0 && regionSafarisForActive.length === 0 && (
                <p className="text-on-surface-variant text-center py-8">
                  {t('experiences.noExperiencesYet', { name: activeDestination.name })}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex justify-between items-center pt-8 border-t border-sand-stone">
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="min-h-[44px] inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
        >
          <ArrowLeft size={18} />
          {t('experiences.back')}
        </button>
        {activeDestination && (
          <span className="text-on-surface-variant text-sm hidden sm:block">
            {t('experiences.selectedCount', { count: selectedCountForActive, name: activeDestination.name })}
          </span>
        )}
        <button
          type="button"
          disabled={plan.experienceIds.length === 0}
          onClick={() => navigate('/plan/details')}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(30,142,62,0.2)]"
        >
          {t('experiences.next')}
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}
