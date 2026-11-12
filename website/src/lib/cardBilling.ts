import type { CardBilling } from '../api/bookings'

export const EMPTY_CARD_BILLING: CardBilling = { phoneNumber: '', country: '', city: '', address: '' }

/** Whether every detail Senjaropay requires is filled in, with a phone number long enough
 * to include a country code. The server checks again. */
export function isCardBillingComplete(billing: CardBilling): boolean {
  const digits = billing.phoneNumber.replace(/\D/g, '')
  return (
    digits.length >= 7 &&
    digits.length <= 15 &&
    billing.country.trim() !== '' &&
    billing.city.trim() !== '' &&
    billing.address.trim() !== ''
  )
}
