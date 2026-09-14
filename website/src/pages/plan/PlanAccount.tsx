import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { AccountFields, type AccountMode } from '../../components/checkout/AccountFields'

export function PlanAccount() {
  const { t } = useTranslation('plan')
  const { plan } = useTripPlan()
  const navigate = useNavigate()
  const { user, login, register } = useAuth()

  const [accountMode, setAccountMode] = useState<AccountMode>('register')
  const [signInEmail, setSignInEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    // Already signed in (or just did on this step) — nothing left to do here.
    if (user) {
      navigate('/plan/payment')
      return
    }
    // Landed here directly without going through Review first.
    if (!plan.contactEmail) {
      navigate('/plan/review')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, plan.contactEmail])

  if (user || !plan.contactEmail) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (accountMode === 'register') {
        await register(plan.contactEmail, plan.contactName, password)
      } else {
        await login(signInEmail, password)
      }
      navigate('/plan/payment')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('account.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          {accountMode === 'register' ? t('account.createHeading') : t('account.signInHeading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {accountMode === 'register' ? t('account.registerSubtitle') : t('account.signInSubtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-6"
      >
        <AccountFields
          accountMode={accountMode}
          onAccountModeChange={setAccountMode}
          email={plan.contactEmail}
          password={password}
          onPasswordChange={setPassword}
          signInEmail={signInEmail}
          onSignInEmailChange={setSignInEmail}
          onEditDetails={() => navigate('/plan/review')}
        />

        {formError && (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/plan/review')}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <ArrowLeft size={18} />
            {t('account.back')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-8 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? t('account.pleaseWait')
              : accountMode === 'register'
                ? t('account.createAccountAndContinue')
                : t('account.signInAndContinue')}
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </form>
    </div>
  )
}
