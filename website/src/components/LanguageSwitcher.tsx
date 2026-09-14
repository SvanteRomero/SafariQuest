import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Translate } from '@phosphor-icons/react'
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '../i18n/locales'
import { useCurrentLocale } from '../i18n/useLocale'
import type { Locale } from '../i18n/locales'

function pathWithLocale(pathname: string, search: string, hash: string, next: Locale) {
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '')
  return `/${next}${rest}${search}${hash}`
}

export function LanguageSwitcher({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false)
  const locale = useCurrentLocale()
  const navigate = useNavigate()
  const location = useLocation()

  function switchTo(next: Locale) {
    setOpen(false)
    navigate(pathWithLocale(location.pathname, location.search, location.hash, next), { replace: true })
  }

  if (variant === 'mobile') {
    return (
      <div className="border-t border-surface-variant mt-1 pt-4">
        <span className="font-label-md text-label-md text-on-surface-variant px-2 mb-2 block">Language</span>
        <div className="flex flex-wrap gap-2 px-2">
          {SUPPORTED_LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              aria-current={code === locale ? 'true' : undefined}
              className={`font-label-md text-label-md min-h-[44px] px-3 rounded-lg ${
                code === locale
                  ? 'bg-surface-container-low text-savanna-green'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Language"
        aria-label="Language"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 border border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors rounded-full shrink-0"
      >
        <Translate size={16} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 mt-2 w-40 bg-ivory-base border border-surface-variant rounded-lg shadow-lg py-1 z-50"
          >
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                role="menuitem"
                onClick={() => switchTo(code)}
                aria-current={code === locale ? 'true' : undefined}
                className={`w-full text-left font-label-md text-label-md px-4 py-2 min-h-[44px] flex items-center ${
                  code === locale ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
