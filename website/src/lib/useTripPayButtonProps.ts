import { useTranslation } from 'react-i18next'
import type { PaymentAvailability } from '../api/bookings'
import type { TripPayMethod } from '../components/checkout/TripPayButton'
import type { Currency } from './money'

/** What a trip's pay buttons (TripPayButton) need from its currency: TZS pays through
 * Snippe — a phone prompt in direct mode, stopped while Snippe is down — and USD by card
 * through Senjaropay, once that's connected. Shared by My Trips and the trip page. */
export function useTripPayButtonProps(availability: PaymentAvailability | null) {
  const { t } = useTranslation('booking')
  // Direct unless the server says hosted; it's the server that decides either way.
  const directMode = availability?.mode !== 'hosted'
  return (currency: Currency) => {
    const usdUnavailable = currency === 'USD' && !availability?.currencies?.USD
    let method: TripPayMethod = directMode ? 'phone' : 'hosted'
    if (currency === 'USD') method = 'card'
    return {
      method,
      disabled: (currency === 'TZS' && Boolean(availability?.blocked)) || usdUnavailable,
      note: usdUnavailable ? t('currencyChoice.usdComingSoon') : null,
    }
  }
}
