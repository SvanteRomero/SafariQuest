import { useTranslation } from 'react-i18next'

export interface Faq {
  key: string
  question: string
  answer: string
}

export interface FaqCategory {
  key: string
  category: string
  items: Faq[]
}

export const faqStructure = [
  { key: 'bookingPayment', items: ['howDoIBook', 'paymentMethods', 'depositRequired'] },
  { key: 'visasEntry', items: ['visaRequired', 'documentsNeeded'] },
  { key: 'bestTimeToVisit', items: ['migrationTiming', 'weather'] },
  { key: 'packing', items: ['whatToPack', 'luggageRestrictions'] },
  { key: 'healthSafety', items: ['vaccinations', 'safety'] },
  { key: 'cancellationPolicy', items: ['cancellationPolicy', 'travelInsurance'] },
] as const

export function useFaqCategories(): FaqCategory[] {
  const { t } = useTranslation('faqs')
  return faqStructure.map((cat) => ({
    key: cat.key,
    category: t(`categories.${cat.key}.title`),
    items: cat.items.map((itemKey) => ({
      key: itemKey,
      question: t(`categories.${cat.key}.items.${itemKey}.question`),
      answer: t(`categories.${cat.key}.items.${itemKey}.answer`),
    })),
  }))
}
