import { useState } from 'react'
import { CheckCircle, Tag, XCircle } from '@phosphor-icons/react'
import { validateReferralCode } from '../../api/referrals'
import { ApiError } from '../../lib/api'

/** Optional referral code entry for the payment step. Validates on blur so the
 * discount (and the resulting deposit) is confirmed before the tourist submits,
 * rather than failing silently at the very end. */
export function ReferralCodeField({
  code,
  onCodeChange,
  onDiscountChange,
}: {
  code: string
  onCodeChange: (value: string) => void
  onDiscountChange: (discountPercent: number | null) => void
}) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState('')

  async function handleBlur() {
    const trimmed = code.trim()
    if (!trimmed) {
      setStatus('idle')
      onDiscountChange(null)
      return
    }
    setStatus('checking')
    try {
      const { discountPercent } = await validateReferralCode(trimmed)
      setStatus('valid')
      setMessage(`${discountPercent}% discount applied`)
      onDiscountChange(discountPercent)
    } catch (err) {
      setStatus('invalid')
      setMessage(err instanceof ApiError ? err.message : "This code isn't valid.")
      onDiscountChange(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="referral-code" className="font-label-md text-label-sm text-on-surface-variant">
        Referral Code <span className="text-on-surface-variant/70">(optional)</span>
      </label>
      <div className="relative">
        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
        <input
          id="referral-code"
          value={code}
          onChange={(e) => {
            onCodeChange(e.target.value.toUpperCase())
            setStatus('idle')
            onDiscountChange(null)
          }}
          onBlur={handleBlur}
          placeholder="e.g. TEKLA2X4K"
          className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg pl-11 pr-4 py-3 tracking-widest focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
      </div>
      {status === 'checking' && <p className="text-on-surface-variant text-sm">Checking code…</p>}
      {status === 'valid' && (
        <p className="text-savanna-green text-sm flex items-center gap-1.5">
          <CheckCircle size={15} weight="fill" />
          {message}
        </p>
      )}
      {status === 'invalid' && (
        <p className="text-error text-sm flex items-center gap-1.5">
          <XCircle size={15} weight="fill" />
          {message}
        </p>
      )}
    </div>
  )
}
