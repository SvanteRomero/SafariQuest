import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from './useLocale'

export function LocaleRoot() {
  const { i18n } = useTranslation()
  const locale = useCurrentLocale()

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
    document.documentElement.lang = locale
  }, [locale, i18n])

  return <Outlet />
}
