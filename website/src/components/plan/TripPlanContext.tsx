import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TripPlanContext, defaultTripPlan, type TripPlanState, type TripPlanContextValue } from './tripPlanStore'

export function TripPlanProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()

  // The About page hands off here with ?interest=..., so whatever the visitor
  // said they cared about survives into the plan's notes — which PlanReview
  // folds into the booking's message for whoever picks up the inquiry.
  // Destination Detail's "Start Planning" hands off with ?region=..., so the
  // region the visitor was already looking at is pre-selected instead of
  // sending them back to the region-picking step they just came from.
  // Seeded in the useState initializer rather than an effect: this repo treats
  // react-hooks/set-state-in-effect as an error, and a lazy initializer is the
  // correct way to derive initial state anyway.
  const [plan, setPlan] = useState<TripPlanState>(() => {
    const interest = searchParams.get('interest')?.trim()
    const region = searchParams.get('region')?.trim()
    return {
      ...defaultTripPlan,
      ...(region ? { destinationIds: [region] } : {}),
      ...(interest ? { notes: `Primary interest: ${interest}` } : {}),
    }
  })

  function toggleDestination(id: string) {
    setPlan((p) => ({
      ...p,
      destinationIds: p.destinationIds.includes(id)
        ? p.destinationIds.filter((d) => d !== id)
        : [...p.destinationIds, id],
    }))
  }

  function toggleExperience(id: string) {
    setPlan((p) => ({
      ...p,
      experienceIds: p.experienceIds.includes(id)
        ? p.experienceIds.filter((e) => e !== id)
        : [...p.experienceIds, id],
    }))
  }

  const value: TripPlanContextValue = {
    plan,
    toggleDestination,
    toggleExperience,
    setDays: (days) => setPlan((p) => ({ ...p, days })),
    setTravelDates: (travelDates) => setPlan((p) => ({ ...p, travelDates })),
    setAdults: (adults) => setPlan((p) => ({ ...p, adults })),
    setChildren: (children) => setPlan((p) => ({ ...p, children })),
    setAccommodationTier: (accommodationTier) => setPlan((p) => ({ ...p, accommodationTier })),
    setNotes: (notes) => setPlan((p) => ({ ...p, notes })),
  }

  return <TripPlanContext.Provider value={value}>{children}</TripPlanContext.Provider>
}
