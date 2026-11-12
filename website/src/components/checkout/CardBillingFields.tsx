import { useTranslation } from 'react-i18next'
import { CreditCard } from '@phosphor-icons/react'
import type { CardBilling } from '../../api/bookings'

const INPUT_CLASS =
  'w-full min-w-0 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green disabled:opacity-60'

const FIELDS: { key: keyof CardBilling; autoComplete: string; type: string; wide?: boolean }[] = [
  { key: 'phoneNumber', autoComplete: 'tel', type: 'tel' },
  { key: 'country', autoComplete: 'country-name', type: 'text' },
  { key: 'city', autoComplete: 'address-level2', type: 'text' },
  { key: 'address', autoComplete: 'street-address', type: 'text', wide: true },
]

/** The cardholder details Senjaropay asks for on a USD card payment. The card itself is
 * entered on Senjaropay's secure page, never here.
 *
 * `stacked` puts every field on its own row — for narrow places like a trip card, where
 * two columns leave the fields too small to read. The fields are marked required for
 * assistive tech only: the pay button stays off until they're filled, so the browser's
 * own "Please fill in this field" bubble would only pop up early and out of place. */
export function CardBillingFields({
  idPrefix,
  value,
  onChange,
  disabled,
  stacked = false,
}: Readonly<{
  idPrefix: string
  value: CardBilling
  onChange: (value: CardBilling) => void
  disabled?: boolean
  stacked?: boolean
}>) {
  const { t } = useTranslation('booking')
  return (
    <fieldset className="space-y-3 min-w-0">
      <legend className="flex items-center gap-2 font-label-md text-on-surface mb-1">
        <CreditCard size={20} className="text-savanna-green shrink-0" />
        {t('cardPay.billingHeading')}
      </legend>
      <p className="text-sm text-on-surface-variant">{t('cardPay.billingNote')}</p>
      <div className={stacked ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        {FIELDS.map((field) => (
          <div key={field.key} className={`flex flex-col gap-1.5 min-w-0 ${field.wide && !stacked ? 'sm:col-span-2' : ''}`}>
            <label htmlFor={`${idPrefix}-${field.key}`} className="font-label-md text-label-sm text-on-surface-variant">
              {t(`cardPay.fields.${field.key}`)}
            </label>
            <input
              id={`${idPrefix}-${field.key}`}
              type={field.type}
              autoComplete={field.autoComplete}
              aria-required="true"
              disabled={disabled}
              placeholder={t(`cardPay.placeholders.${field.key}`)}
              value={value[field.key]}
              onChange={(e) => onChange({ ...value, [field.key]: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}
