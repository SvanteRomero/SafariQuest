import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from './locales'

export function detectPreferredLocale(): Locale {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]

  for (const candidate of candidates) {
    const short = candidate.slice(0, 2).toLowerCase()
    if (isSupportedLocale(short)) return short
  }

  return DEFAULT_LOCALE
}
