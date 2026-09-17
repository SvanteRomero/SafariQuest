import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, HandCoins } from '@phosphor-icons/react'
import { registerAgent } from '../api/referrals'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'

export function ReferralSignup() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '')
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setSubmitting(true)
    try {
      await registerAgent({ name, email, password })
      await refreshUser()
      navigate('/agent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-16 md:py-24 bg-surface-container-low">
      <div className="w-full max-w-md bg-ivory-base rounded-2xl shadow-[0_10px_30px_-10px_rgba(45,45,45,0.15)] px-6 sm:px-10 py-12">
        <header className="mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-savanna-green/10 flex items-center justify-center mx-auto mb-4">
            <HandCoins size={28} className="text-savanna-green" />
          </div>
          <h1 className="font-headline-md text-headline-md text-savanna-green mb-2">Become a Referral Agent</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Earn a commission every time someone books using your referral code.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="agent-name" className="block font-label-sm text-label-sm text-on-surface mb-2">
              Full Name
            </label>
            <input
              id="agent-name"
              name="name"
              type="text"
              placeholder="Tekla Massawe"
              required
              autoComplete="name"
              className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          <div>
            <label htmlFor="agent-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
              Email Address
            </label>
            <input
              id="agent-email"
              name="email"
              type="email"
              placeholder="tekla@example.com"
              required
              autoComplete="email"
              className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          <div>
            <label htmlFor="agent-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
              Create Password
            </label>
            <input
              id="agent-password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          {error && (
            <p role="alert" className="text-error font-label-sm text-label-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating Account…' : 'Create Agent Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="font-label-sm text-label-sm text-outline hover:text-savanna-green inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    </section>
  )
}
