import { useTranslation } from 'react-i18next'
import { Check, Clock } from '@phosphor-icons/react'
import type { SafariPackage } from '../../api/safaris'
import type { RegionSafari } from '../../api/regionSafaris'
import { formatProductPrice, type Currency } from '../../lib/money'

/** One experience on the trip planner. The whole card is the toggle — a click anywhere
 * selects or deselects it — so the "Select Experience" line at the bottom is only a label,
 * not a separate button. */
export function ExperienceCard({
  safari,
  selected,
  currency,
  onToggle,
}: Readonly<{
  safari: SafariPackage | RegionSafari
  selected: boolean
  currency: Currency
  onToggle: () => void
}>) {
  const { t, i18n } = useTranslation('plan')
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`group relative w-full text-left rounded-xl overflow-hidden bg-surface-container-lowest transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-savanna-green ${
        selected ? 'ring-2 ring-savanna-green shadow-lg' : 'ring-1 ring-sand-stone hover:shadow-lg'
      }`}
    >
      <span
        className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          selected ? 'bg-savanna-green' : 'bg-surface/90 border border-outline-variant'
        }`}
      >
        {selected && <Check size={16} weight="bold" className="text-on-primary" />}
      </span>
      <span className="block h-40 relative">
        <img src={safari.image} alt={safari.imageAlt} className="absolute inset-0 w-full h-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-deep-earth/50 to-transparent" />
        <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-label-sm font-label-sm text-on-surface">
            <Clock size={13} />
            {t('experiences.day', { count: safari.days })}
          </span>
          <span className="bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-label-sm font-label-sm text-on-surface">
            {formatProductPrice(safari, currency, i18n.language)}
          </span>
        </span>
      </span>
      <span className="block p-6">
        <span className="block font-headline-md text-[20px] text-on-surface mb-2">{safari.title}</span>
        <span className="block font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-2">{safari.overview}</span>
        <span
          className={`block w-full text-center py-3 rounded-lg font-label-md text-label-md transition-colors ${
            selected
              ? 'bg-surface-container text-on-surface-variant'
              : 'border border-outline-variant text-on-surface group-hover:border-savanna-green group-hover:text-savanna-green'
          }`}
        >
          {selected ? t('experiences.selected') : t('experiences.selectExperience')}
        </span>
      </span>
    </button>
  )
}
