import { useState } from 'react'

/**
 * A whole-number field for prices and quantities. Not `type="number"`: that one keeps a
 * real 0 in the box (so typing "1" next to it gives "10" or "01"), shows a spinner, and
 * changes value on a stray scroll. Here the box is empty until something is typed, only
 * digits are kept, and away from the field the number is grouped (2,600,000) so large
 * TZS amounts are readable. An empty box counts as `emptyValue`.
 */
export function AmountInput({
  value,
  onChange,
  emptyValue = 0,
  prefix,
  className = '',
  ...rest
}: Readonly<{
  value: number
  onChange: (value: number) => void
  /** What an empty box means: 0 for a price; a quantity snaps back to 1 when left. */
  emptyValue?: number
  /** Shown inside the box before the number, e.g. the currency. */
  prefix?: string
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}>) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  // An unset price shows as an empty box (with its placeholder), not "0".
  const unset = emptyValue === 0 && value === 0
  let shown = ''
  if (focused) shown = draft
  else if (!unset) shown = value.toLocaleString('en-US')

  return (
    <div
      className={`flex items-center bg-surface border border-sand-stone rounded-lg focus-within:ring-2 focus-within:ring-savanna-green/40 focus-within:border-savanna-green ${
        rest.disabled ? 'opacity-60' : ''
      } ${className}`}
    >
      {prefix && <span className="pl-3 text-xs font-label-md text-on-surface-variant select-none">{prefix}</span>}
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        onFocus={() => {
          setDraft(value === 0 ? '' : String(value))
          setFocused(true)
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
          setDraft(digits)
          onChange(digits === '' ? emptyValue : Number(digits))
        }}
        onBlur={() => setFocused(false)}
        className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-right tabular-nums focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  )
}
