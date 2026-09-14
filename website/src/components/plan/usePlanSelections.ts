import { getDestinations } from '../../api/destinations'
import { getSafaris, type SafariPackage } from '../../api/safaris'
import { getRegionSafaris, type RegionSafari } from '../../api/regionSafaris'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from './tripPlanStore'

/**
 * Resolves the trip plan's selected destination/experience ids against the catalog,
 * shared by PlanReview and PlanPayment so both agree on what's selected and whether
 * data is still loading (the loading flag matters: evaluating selections before the
 * catalog fetches resolve reads as "nothing selected").
 */
export function usePlanSelections() {
  const { plan } = useTripPlan()
  const { data: destinations, loading: destinationsLoading } = useFetch(getDestinations, [])
  const { data: safaris, loading: safarisLoading } = useFetch(getSafaris, [])
  const { data: regionSafaris, loading: regionSafarisLoading } = useFetch(getRegionSafaris, [])
  const loading = destinationsLoading || safarisLoading || regionSafarisLoading

  const selectedDestinations = (destinations ?? []).filter((d) => plan.destinationIds.includes(d.id))
  const selectedSafaris = (safaris ?? []).filter((s) => plan.experienceIds.includes(s.id))
  const selectedRegionSafaris = (regionSafaris ?? []).filter((s) => plan.experienceIds.includes(s.id))
  const selectedExperiences: { id: string; title: string }[] = [
    ...selectedSafaris.map((s) => ({ id: s.id, title: s.title })),
    ...selectedRegionSafaris.map((s) => ({ id: s.id, title: s.title })),
  ]
  // Booking has one primary product (safari or region_safari); everything else selected
  // folds into the message for the admin to read while quoting the rest of the trip.
  const primarySafari: SafariPackage | undefined = selectedSafaris[0]
  const primaryRegionSafari: RegionSafari | undefined = selectedRegionSafaris[0]
  const primaryPrice = primarySafari?.price ?? primaryRegionSafari?.price
  const hasPrimaryProduct = selectedSafaris.length > 0 || selectedRegionSafaris.length > 0

  return {
    loading,
    selectedDestinations,
    selectedSafaris,
    selectedRegionSafaris,
    selectedExperiences,
    primarySafari,
    primaryRegionSafari,
    primaryPrice,
    hasPrimaryProduct,
  }
}
