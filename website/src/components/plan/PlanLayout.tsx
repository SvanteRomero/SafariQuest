import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from '@phosphor-icons/react'
import { TripPlanProvider } from './TripPlanContext'
import { useAuth } from '../../auth/AuthContext'

const ALL_STEP_KEYS = [
  { path: '/plan', key: 'regions' },
  { path: '/plan/experiences', key: 'experiences' },
  { path: '/plan/details', key: 'details' },
  { path: '/plan/review', key: 'review' },
  { path: '/plan/account', key: 'account' },
  { path: '/plan/payment', key: 'payment' },
] as const

function PlanSteps() {
  const { t } = useTranslation('plan')
  const location = useLocation()
  const { user } = useAuth()
  // location.pathname carries the locale prefix (e.g. /en/plan/details); ALL_STEP_KEYS'
  // paths don't, so strip it before comparing — same pattern as LanguageSwitcher.
  const unprefixedPath = location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '')
  // Signed-in visitors skip the Account step entirely (PlanReview/PlanAccount both
  // redirect past it), so it shouldn't occupy a slot in the stepper for them either.
  const stepKeys = user ? ALL_STEP_KEYS.filter((s) => s.path !== '/plan/account') : ALL_STEP_KEYS
  const steps = stepKeys.map((s) => ({ path: s.path, label: t(`steps.${s.key}`) }))
  const activeIndex = steps.findIndex((s) => s.path === unprefixedPath)

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-12 max-w-2xl mx-auto">
      {steps.map((step, i) => {
        const isDone = i < activeIndex
        const isActive = i === activeIndex
        return (
          <div key={step.path} className="flex items-center gap-2 md:gap-4 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0 ${
                  isDone ? 'bg-savanna-green text-on-primary' : isActive ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {isDone ? <Check size={16} weight="bold" /> : i + 1}
              </div>
              <span className={`hidden md:block text-xs text-center ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-savanna-green' : 'bg-sand-stone'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function PlanLayout() {
  const { t } = useTranslation('plan')
  return (
    <TripPlanProvider>
      <section className="min-h-screen bg-surface-container-low py-16 md:py-20 px-5 md:px-margin-desktop">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface text-center mb-2">
            {t('header.heading')}
          </h1>
          <p className="text-on-surface-variant text-center mb-10">
            {t('header.subtitle')}
          </p>
          <PlanSteps />
          <Outlet />
        </div>
      </section>
    </TripPlanProvider>
  )
}
