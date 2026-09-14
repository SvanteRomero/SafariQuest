import { Link, useParams } from 'react-router-dom'
import { getRegionSafari, type RegionSafari } from '../api/regionSafaris'
import { getDestinations } from '../api/destinations'
import { useFetch } from '../lib/useFetch'
import { SafariLikeDetail } from '../components/SafariLikeDetail'

export function RegionSafariDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: regionSafari, loading, error } = useFetch<RegionSafari>(() => getRegionSafari(id!), [id])
  const { data: destinations } = useFetch(getDestinations, [])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !regionSafari) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Safari Not Found</h1>
          <Link
            to="/destinations"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Back to Destinations
          </Link>
        </div>
      </section>
    )
  }

  const regionName = (destinations ?? []).find((d) => d.id === regionSafari.region)?.name ?? regionSafari.region

  return (
    <SafariLikeDetail
      title={regionSafari.title}
      image={regionSafari.image}
      imageAlt={regionSafari.imageAlt}
      galleryImages={regionSafari.galleryImages}
      days={regionSafari.days}
      badge={regionSafari.badge}
      accommodation={regionSafari.accommodation}
      locationLabel={regionName}
      price={regionSafari.price}
      overview={regionSafari.overview}
      highlights={regionSafari.highlights}
      included={regionSafari.included}
      excluded={regionSafari.excluded}
      itinerary={regionSafari.itinerary}
      bookPath={`/region-safaris/${regionSafari.id}/book`}
    />
  )
}
