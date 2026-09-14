import type { To } from 'react-router-dom'
import type { Locale } from './locales'

export function localize(locale: Locale, to: To): To {
  if (typeof to !== 'string') return to
  if (!to.startsWith('/') || to.startsWith('//')) return to
  return `/${locale}${to}`
}
