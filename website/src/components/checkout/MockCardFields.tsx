import { Info } from '@phosphor-icons/react'

/** Mock card-detail inputs shared by every checkout flow with a payment step. None of
 * this ever reaches the backend — only the computed deposit amount does. Real card
 * processing is PLANNED; this exists so the account → paid → confirmed flow is real
 * end to end in the meantime, without pretending to collect real payment details. */
export function MockCardFields({
  namePlaceholder,
  cardName,
  onCardNameChange,
  cardNumber,
  onCardNumberChange,
  cardExpiry,
  onCardExpiryChange,
  cardCvv,
  onCardCvvChange,
}: {
  namePlaceholder: string
  cardName: string
  onCardNameChange: (value: string) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  cardExpiry: string
  onCardExpiryChange: (value: string) => void
  cardCvv: string
  onCardCvvChange: (value: string) => void
}) {
  return (
    <div>
      <p className="text-terracotta text-sm mb-6 flex items-center gap-1.5">
        <Info size={15} />
        Test mode — card processing isn&apos;t connected yet, so no real charge will be made.
      </p>
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="card-name" className="font-label-md text-label-sm text-on-surface-variant">
            Name on Card
          </label>
          <input
            id="card-name"
            required
            value={cardName}
            onChange={(e) => onCardNameChange(e.target.value)}
            placeholder={namePlaceholder}
            className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="card-number" className="font-label-md text-label-sm text-on-surface-variant">
            Card Number
          </label>
          <input
            id="card-number"
            required
            inputMode="numeric"
            pattern="[0-9 ]{12,19}"
            value={cardNumber}
            onChange={(e) => onCardNumberChange(e.target.value)}
            placeholder="4242 4242 4242 4242"
            className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="card-expiry" className="font-label-md text-label-sm text-on-surface-variant">
              Expiry (MM/YY)
            </label>
            <input
              id="card-expiry"
              required
              inputMode="numeric"
              pattern="[0-9]{2}/[0-9]{2}"
              value={cardExpiry}
              onChange={(e) => onCardExpiryChange(e.target.value)}
              placeholder="12/28"
              className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="card-cvv" className="font-label-md text-label-sm text-on-surface-variant">
              CVV
            </label>
            <input
              id="card-cvv"
              required
              inputMode="numeric"
              pattern="[0-9]{3,4}"
              value={cardCvv}
              onChange={(e) => onCardCvvChange(e.target.value)}
              placeholder="123"
              className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
