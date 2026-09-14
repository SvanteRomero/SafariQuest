import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { NavigateOptions, To } from 'react-router-dom'
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from './locales'
import { localize } from './localize'
import { ROLE_HOME, type Role } from '../api/auth'

// Locale branches are static path segments (`path="fr"`, not `path=":lang"`), so there's
// no route param to read via useParams() — the active locale is the URL's first segment.
export function useCurrentLocale(): Locale {
  const { pathname } = useLocation()
  const first = pathname.split('/')[1]
  return isSupportedLocale(first) ? first : DEFAULT_LOCALE
}

interface LocalizedNavigateFunction {
  (to: To, options?: NavigateOptions): void | Promise<void>
  (delta: number): void | Promise<void>
}

export function useLocalizedNavigate(): LocalizedNavigateFunction {
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') return navigate(to)
      return navigate(localize(locale, to), options)
    },
    [navigate, locale],
  )
}

// ROLE_HOME sends tourists to /account (in-scope, locale-prefixed) but guides and
// admins to /guide and /admin — portals that are deliberately unprefixed and untouched
// by i18n, so only the tourist destination should ever get a locale prefix here.
export function useRoleHomeNavigate() {
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  return useCallback(
    (role: Role) => {
      const path = ROLE_HOME[role]
      navigate(role === 'tourist' ? localize(locale, path) : path)
    },
    [navigate, locale],
  )
}
