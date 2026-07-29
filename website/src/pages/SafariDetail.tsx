import { Link, useParams } from 'react-router-dom'
import { safariPackages } from '../data/safaris'

export function SafariDetail() {
  const { id } = useParams<{ id: string }>()
  const safari = safariPackages.find((p) => p.id === id)

  return (
    <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
      <div className="max-w-xl">
        <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">Coming Soon</span>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
          {safari ? safari.title : 'Itinerary'}
        </h1>
        <p className="text-on-surface-variant font-body-lg mb-8">
          The detailed day-by-day itinerary for this safari is being finalized. In the meantime, reach out to our
          specialists and we'll send it straight to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/about#contact"
            className="min-h-[44px] flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Request This Itinerary
          </Link>
          <Link
            to="/safaris"
            className="min-h-[44px] flex items-center justify-center border border-savanna-green text-savanna-green px-8 py-3.5 rounded-full font-label-md hover:bg-savanna-green hover:text-on-primary transition-colors"
          >
            Back to Safaris
          </Link>
        </div>
      </div>
    </section>
  )
}
