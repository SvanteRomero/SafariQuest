import { Link } from 'react-router-dom'
import { ExperienceRow } from '../components/ExperienceRow'
import { experiences, experiencesHero } from '../data/experiences'

export function Experiences() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[500px] md:h-[560px] flex items-end md:items-center overflow-hidden">
        <img
          src={experiencesHero.image}
          alt={experiencesHero.imageAlt}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto pb-10 md:pb-0">
          <span className="text-golden-sun font-label-md tracking-widest uppercase mb-3 block">
            Discover the Extraordinary
          </span>
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-4">
            Unforgettable Safari <span className="italic">Experiences</span>
          </h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl">
            From the silent drift of a hot air balloon to the mythic pulse of Maasai traditions, every moment in
            Tanzania is a story waiting to be told.
          </p>
        </div>
      </section>

      {experiences.map((experience, i) => (
        <ExperienceRow key={experience.id} experience={experience} reverse={i % 2 === 1} />
      ))}

      {/* Closing CTA */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop text-center max-w-3xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
          Ready to design your own story?
        </h2>
        <p className="text-on-surface-variant font-body-lg mb-8">
          Mix and match these experiences into a single bespoke itinerary — our specialists handle the logistics.
        </p>
        <Link
          to="/about#contact"
          className="inline-flex min-h-[44px] items-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          Talk to a Safari Specialist
        </Link>
      </section>
    </>
  )
}
