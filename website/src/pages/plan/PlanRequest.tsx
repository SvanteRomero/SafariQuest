import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, PaperPlaneTilt } from '@phosphor-icons/react'
import { Link } from '../../i18n/routing'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { createBooking, getPaymentAvailability } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { usePlanSelections } from '../../components/plan/usePlanSelections'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { addDays } from '../../lib/date'
import { trackFunnelEvent } from '../../lib/funnelTracking'
import { ReferralCodeField } from '../../components/checkout/ReferralCodeField'
import { productPrice, type Currency } from '../../lib/money'
import { useDisplayCurrency } from '../../lib/currencyPreference'
import { CurrencyChoice } from '../../components/checkout/CurrencyChoice'

/**
 * The trip planner's last step: sends the trip the tourist designed as a quote request.
 * Nothing is paid here — an admin prices the whole trip (every experience chosen, the
 * accommodation style, the notes) and sends a quote, and the tourist then pays its 30%
 * deposit from My Trips. The booking records the first experience chosen as its product;
 * everything else goes in the message the admin quotes from.
 */
export function PlanRequest() {
  const { t } = useTranslation('plan')
  const { plan } = useTripPlan()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    loading: selectionsLoading,
    selectedDestinations,
    selectedExperiences,
    primarySafari,
    primaryRegionSafari,
    primaryPrice,
  } = usePlanSelections()
  const { data: paymentAvailability } = useFetch(getPaymentAvailability, [])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number | null>(null)
  // What the quote will be priced and paid in: the visitor's currency, shared with the
  // header toggle — choosing here switches the whole site, and vice versa.
  const { currency: chosenCurrency, setCurrency: setChosenCurrency } = useDisplayCurrency()

  useEffect(() => {
    if (selectionsLoading || sent) return
    if (!plan.contactEmail || !plan.travelDates || primaryPrice === undefined) {
      void navigate('/plan/review')
      return
    }
    if (!user) {
      void navigate('/plan/account')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionsLoading, plan.contactEmail, plan.travelDates, primaryPrice, user, sent])

  if (sent) {
    return (
      <output className="block max-w-lg mx-auto text-center">
        <CheckCircle size={56} weight="fill" className="mx-auto text-savanna-green mb-6" />
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          {t('request.sentHeading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          {t('request.sentBody', { email: user?.email ?? plan.contactEmail })}
        </p>
        <Link
          to="/account"
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          {t('request.goToMyTrips')}
        </Link>
      </output>
    )
  }

  if (selectionsLoading || !plan.contactEmail || !plan.travelDates || primaryPrice === undefined || !user) {
    return null
  }

  // A trip with no USD price can only be quoted in TZS, whatever was chosen.
  const product = primarySafari ?? primaryRegionSafari
  const usdPriced = product ? productPrice(product, 'USD') !== null : false
  const currency: Currency = usdPriced ? chosenCurrency : 'TZS'
  const travelers = plan.adults + plan.children

  function buildMessage(): string {
    const lines = [
      t('message.destinations', { list: selectedDestinations.map((d) => d.name).join(', ') || t('message.noneSelected') }),
      t('message.experiences', { list: selectedExperiences.map((e) => e.title).join(', ') || t('message.noneSelected') }),
      t('message.accommodationStyle', { style: t(`details.tiers.${plan.accommodationTier}.title`) }),
    ]
    if (plan.contactPhone) lines.push(t('message.phoneWhatsApp', { phone: plan.contactPhone }))
    if (plan.notes) lines.push(t('message.notes', { notes: plan.notes }))
    return lines.join('\n')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      await createBooking({
        name: plan.contactName,
        email: plan.contactEmail,
        safari: primarySafari?.id,
        regionSafari: primarySafari ? undefined : primaryRegionSafari?.id,
        startDate: plan.travelDates,
        endDate: addDays(plan.travelDates, plan.days),
        guests: travelers,
        children: plan.children,
        message: buildMessage(),
        currency,
        quoteRequested: true,
        referralCode: referralDiscountPercent ? referralCode.trim() : undefined,
      })
      trackFunnelEvent('submitted')
      setSent(true)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('request.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">{t('request.heading')}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{t('request.subtitle')}</p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-6"
      >
        <ol className="space-y-3 text-sm text-on-surface">
          {(['stepQuote', 'stepEmail', 'stepDeposit'] as const).map((key, i) => (
            <li key={key} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-savanna-green/10 text-savanna-green font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{t(`request.${key}`)}</span>
            </li>
          ))}
        </ol>

        <CurrencyChoice
          name="plan-currency"
          value={currency}
          onChange={setChosenCurrency}
          usdPriced={usdPriced}
          // Nothing is paid now, so USD only needs to be payable by the time the quote is.
          usdPayable={Boolean(paymentAvailability?.currencies?.USD)}
        />
        <ReferralCodeField code={referralCode} onCodeChange={setReferralCode} onDiscountChange={setReferralDiscountPercent} />

        {submitError && (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => void navigate('/plan/review')}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <ArrowLeft size={18} />
            {t('request.back')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-8 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t('request.sending') : t('request.send')}
            <PaperPlaneTilt size={18} weight="bold" />
          </button>
        </div>
      </form>
    </div>
  )
}
