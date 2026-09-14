import { Fragment, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CreditCard,
  CalendarBlank,
  Users,
  MapPin,
  ShieldCheck,
  Leaf,
  Lock,
  ArrowLeft,
  ArrowRight,
  PencilSimple,
  Info,
} from '@phosphor-icons/react'
import { getSafari, type SafariPackage } from '../api/safaris'
import { getRegionSafari, type RegionSafari } from '../api/regionSafaris'
import { getDestinations } from '../api/destinations'
import { createBooking, payForBooking } from '../api/bookings'
import { getSeasons } from '../api/pricing'
import { useFetch } from '../lib/useFetch'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { addDays } from '../lib/date'
import { activeSeasonForDate, seasonalPrice } from '../lib/seasonalPrice'
import { contact } from '../config/contact'
import { AccountFields, type AccountMode } from '../components/checkout/AccountFields'
import { MockCardFields } from '../components/checkout/MockCardFields'

type CheckoutStep = 'details' | 'review' | 'account' | 'payment'

const ALL_STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'account', label: 'Account' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
]

export function Checkout({ kind }: { kind: 'safari' | 'regionSafari' }) {
  const { id } = useParams<{ id: string }>()
  // Both hooks always run (Rules of Hooks) — only the one matching `kind` actually
  // fetches; the other resolves immediately to null, same pattern as an edit-vs-create
  // form fetching "if editing" elsewhere in this codebase.
  const {
    data: safari,
    loading: safariLoading,
    error: safariError,
  } = useFetch<SafariPackage | null>(() => (kind === 'safari' ? getSafari(id!) : Promise.resolve(null)), [kind, id])
  const {
    data: regionSafari,
    loading: regionSafariLoading,
    error: regionSafariError,
  } = useFetch<RegionSafari | null>(
    () => (kind === 'regionSafari' ? getRegionSafari(id!) : Promise.resolve(null)),
    [kind, id],
  )
  const { data: destinations } = useFetch(getDestinations, [])
  const { data: seasons } = useFetch(getSeasons, [])
  const navigate = useNavigate()
  const { user, login, register } = useAuth()
  const isAuthenticated = Boolean(user)

  const [step, setStep] = useState<CheckoutStep>('details')
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [preferredDate, setPreferredDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Account step — only reached when nobody is signed in yet.
  const [accountMode, setAccountMode] = useState<AccountMode>('register')
  const [signInEmail, setSignInEmail] = useState('')
  const [password, setPassword] = useState('')

  // Mock payment step — no gateway is integrated yet (PLANNED); these fields
  // never leave the browser, only the deposit amount does.
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const loading = safariLoading || regionSafariLoading
  const loadError = safariError || regionSafariError
  const source = kind === 'safari' ? safari : regionSafari

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (loadError || !source) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Safari Not Found</h1>
          <Link
            to={kind === 'safari' ? '/safaris' : '/destinations'}
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            {kind === 'safari' ? 'Back to Safaris' : 'Back to Destinations'}
          </Link>
        </div>
      </section>
    )
  }

  // Normalized view over whichever product this checkout is for, so the rest of the
  // page doesn't need to branch on `kind` again.
  const item = {
    id: source.id,
    title: source.title,
    image: source.image,
    imageAlt: source.imageAlt,
    days: source.days,
    price: source.price,
    destination:
      kind === 'safari'
        ? (source as SafariPackage).destination
        : (destinations ?? []).find((d) => d.id === (source as RegionSafari).region)?.name ??
          (source as RegionSafari).region,
  }

  const activeSeason = activeSeasonForDate(seasons ?? [], preferredDate)
  const adultPrice = seasonalPrice(item.price, seasons ?? [], preferredDate)
  const childPrice = Math.round(adultPrice * 0.5)
  const total = adultPrice * adults + childPrice * children
  const deposit = Math.round(total * 0.3)
  const steps = isAuthenticated ? ALL_STEPS.filter((s) => s.key !== 'account') : ALL_STEPS
  const activeIndex = steps.findIndex((s) => s.key === step)
  const safariTitle = item.title
  // Once signed in — whether they arrived that way or just registered/signed in on the
  // Account step — the account's real name/email is authoritative over whatever was typed
  // on the Details step (which may be stale, e.g. after signing in with a different email).
  const displayName = user?.name || fullName
  const displayEmail = user?.email || email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'details') {
      setStep(isAuthenticated ? 'review' : 'account')
      return
    }
    if (step === 'account') {
      setSubmitError(null)
      setSubmitting(true)
      try {
        if (accountMode === 'register') {
          await register(email, fullName, password)
        } else {
          await login(signInEmail, password)
        }
        setStep('review')
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }
    if (step === 'review') {
      setStep('payment')
      return
    }

    // step === 'payment'
    setSubmitError(null)
    setSubmitting(true)
    try {
      const booking = await createBooking({
        name: displayName,
        email: displayEmail,
        safari: kind === 'safari' ? item.id : undefined,
        regionSafari: kind === 'regionSafari' ? item.id : undefined,
        startDate: preferredDate,
        endDate: addDays(preferredDate, item.days),
        guests: adults + children,
        message: `${adults} adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}.`,
      })
      await payForBooking(booking.id, deposit)
      navigate('/booking-confirmed', {
        state: { title: safariTitle, paidAmount: deposit, paidToEmail: booking.customerEmail },
      })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel =
    step === 'payment'
      ? submitting
        ? 'Processing…'
        : `Pay $${deposit.toLocaleString()} & Book`
      : step === 'account'
        ? submitting
          ? 'Please wait…'
          : accountMode === 'register'
            ? 'Create Account & Continue'
            : 'Sign In & Continue'
        : step === 'review'
          ? 'Continue to Payment'
          : isAuthenticated
            ? 'Continue to Review'
            : 'Continue to Account'

  return (
    <section className="min-h-screen bg-surface-container-low py-16 md:py-20 px-5 md:px-margin-desktop">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, i) => {
            const isDone = i < activeIndex
            const isActive = i === activeIndex
            return (
              <Fragment key={s.key}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-label-md font-bold ${
                      isDone || isActive ? 'bg-savanna-green text-on-primary' : 'border-2 border-sand-stone text-on-surface-variant'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`font-label-md text-label-md ${isActive ? 'text-savanna-green' : 'text-on-surface-variant'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-12 md:w-24 mx-2 md:mx-4 -mt-6 ${isDone ? 'bg-savanna-green' : 'bg-sand-stone'}`} />
                )}
              </Fragment>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest rounded-xl p-6 md:p-10 shadow-sm border border-sand-stone"
            >
              {step === 'details' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    Reservation Details
                  </h1>
                  <p className="text-on-surface-variant mb-8">
                    Please provide your details exactly as they appear on your passport to ensure a smooth park
                    entry and lodge check-in for {item.title}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-name" className="font-label-md text-label-sm text-on-surface-variant">
                        Full Name
                      </label>
                      <input
                        id="checkout-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Johnathan Doe"
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-email" className="font-label-md text-label-sm text-on-surface-variant">
                        Email Address
                      </label>
                      <input
                        id="checkout-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        disabled={isAuthenticated}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-adults" className="font-label-md text-label-sm text-on-surface-variant">
                        Adults (12+ yrs)
                      </label>
                      <input
                        id="checkout-adults"
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={adults}
                        onChange={(e) => setAdults(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-children" className="font-label-md text-label-sm text-on-surface-variant">
                        Children (2-11 yrs)
                      </label>
                      <input
                        id="checkout-children"
                        type="number"
                        min={0}
                        step={1}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-date" className="font-label-md text-label-sm text-on-surface-variant">
                        Preferred Start Date
                      </label>
                      <input
                        id="checkout-date"
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green">
                      Review Your Details
                    </h1>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="inline-flex items-center gap-1.5 text-terracotta font-label-md text-label-md hover:opacity-80 transition-opacity"
                    >
                      <PencilSimple size={16} />
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Full Name
                      </p>
                      <p className="font-label-md text-on-surface">{displayName || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Email
                      </p>
                      <p className="font-label-md text-on-surface">{displayEmail || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Travelers
                      </p>
                      <p className="font-label-md text-on-surface">
                        {adults} adult{adults !== 1 ? 's' : ''}
                        {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Preferred Start Date
                      </p>
                      <p className="font-label-md text-on-surface">{preferredDate}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Package
                      </p>
                      <p className="font-label-md text-on-surface">{item.title}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Duration
                      </p>
                      <p className="font-label-md text-on-surface">{item.days} days</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                </div>
              )}

              {step === 'account' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    {accountMode === 'register' ? 'Create Your Account' : 'Sign In'}
                  </h1>
                  <p className="text-on-surface-variant mb-6">
                    {accountMode === 'register'
                      ? "We'll use this to send your booking confirmation and let you track your trip afterward."
                      : 'Sign in to continue — your details will be pulled from your existing account.'}
                  </p>

                  <AccountFields
                    accountMode={accountMode}
                    onAccountModeChange={setAccountMode}
                    email={email}
                    password={password}
                    onPasswordChange={setPassword}
                    signInEmail={signInEmail}
                    onSignInEmailChange={setSignInEmail}
                    onEditDetails={() => setStep('details')}
                  />

                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    Payment
                  </h1>
                  <p className="text-on-surface-variant mb-6">
                    Enter your card details to pay the deposit and secure your booking.
                  </p>

                  <MockCardFields
                    namePlaceholder={fullName || 'Johnathan Doe'}
                    cardName={cardName}
                    onCardNameChange={setCardName}
                    cardNumber={cardNumber}
                    onCardNumberChange={setCardNumber}
                    cardExpiry={cardExpiry}
                    onCardExpiryChange={setCardExpiry}
                    cardCvv={cardCvv}
                    onCardCvvChange={setCardCvv}
                  />

                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                </div>
              )}

            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 py-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <ShieldCheck size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Certified Operator</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Leaf size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Eco-Tourism</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Lock size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Secure Checkout</span>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-sand-stone sticky top-24">
              <div className="h-44 relative">
                <img src={item.image} alt={item.imageAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/70 to-transparent flex items-end p-5">
                  <h2 className="font-headline-md text-[20px] text-ivory-base leading-tight">{item.title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <CalendarBlank size={16} /> Duration
                    </span>
                    <span className="font-label-md text-on-surface">{item.days} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <MapPin size={16} /> Location
                    </span>
                    <span className="font-label-md text-on-surface">{item.destination}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <Users size={16} /> Guests
                    </span>
                    <span className="font-label-md text-on-surface">
                      {adults} adult{adults !== 1 ? 's' : ''}
                      {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
                    </span>
                  </div>
                </div>

                <hr className="border-sand-stone" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>
                      {adults} adult{adults !== 1 ? 's' : ''} × ${adultPrice.toLocaleString()}
                    </span>
                    <span>${(adultPrice * adults).toLocaleString()}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        {children} child{children !== 1 ? 'ren' : ''} × ${childPrice.toLocaleString()}
                      </span>
                      <span>${(childPrice * children).toLocaleString()}</span>
                    </div>
                  )}
                  {activeSeason && (
                    <p className="text-xs text-terracotta">
                      {activeSeason.name} pricing applied ({activeSeason.multiplier}×)
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-sand-stone">
                  <span className="font-label-md text-label-md text-on-surface-variant">TOTAL</span>
                  <span className="font-headline-md text-[28px] text-savanna-green">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-label-md text-label-md text-terracotta">
                  <span>Deposit due now (30%)</span>
                  <span>${deposit.toLocaleString()}</span>
                </div>

                {submitError && (
                  <p role="alert" className="text-center text-error font-label-sm text-label-sm">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-4 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-lg shadow-savanna-green/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ctaLabel}
                  {step === 'payment' && <CreditCard size={18} weight="bold" />}
                  {step !== 'payment' && <ArrowRight size={18} weight="bold" />}
                </button>
                <p className="text-center text-label-sm text-on-surface-variant px-2">
                  By clicking &apos;{ctaLabel}&apos;, you agree to our Terms of Service and Cancellation Policy.
                </p>
              </div>
            </div>

            <div className="mt-6 p-6 bg-terracotta/5 border border-terracotta/20 rounded-xl flex gap-4">
              <Info size={22} className="text-terracotta shrink-0" />
              <div>
                <h4 className="font-label-md text-label-md text-terracotta mb-1">Need Help?</h4>
                <p className="text-sm text-on-surface-variant mb-1">
                  Our safari experts are available 24/7 to assist with your booking.
                </p>
                {contact.phoneHref && (
                  <a href={contact.phoneHref} className="text-terracotta font-bold text-sm hover:underline">
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
