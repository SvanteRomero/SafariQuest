import { Link } from 'react-router-dom'
import { ShieldCheck, MapTrifold, Leaf, ArrowRight, CaretDoubleDown } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { SafariCard } from '../components/SafariCard'
import { signaturePackages } from '../data/safaris'

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Licensed Guides',
    description:
      'Our silver and gold-level certified guides possess decades of experience navigating the Tanzanian bush, ensuring safety and deep ecological insights.',
  },
  {
    icon: MapTrifold,
    title: 'Custom Itineraries',
    description:
      'No two journeys are the same. We craft bespoke schedules that align perfectly with your photographic interests, fitness level, and pace.',
  },
  {
    icon: Leaf,
    title: 'Local Expertise',
    description:
      'Born and raised in Tanzania, our team provides authentic cultural connections and exclusive access to the most secluded wildlife hotspots.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      "An experience that transcends words. Serengeti Quest didn't just show us animals; they shared the soul of Tanzania with us. Our guide, Elias, was like a walking encyclopedia of the bush.",
    name: 'Sarah Jenkins',
    location: 'London, United Kingdom',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBFIMzrREe_jcC3X0qovnWDaglzRGvVy0TWU8RkvZ8FJFjt-G5ui8oQjFLRe3CjGQe2MWNdqNmotnl0vlV60AzI9bMFWwk2Q2eK5OjTg-v-gmsruDqc-NYDmoFI8Z5vwRsPWq1OlFUbnLj_zrLqx3krWRcM6QldqT6dEiHrROyL29Ks4Bdym0GDriAjvrOfWr3vdON_EefgGk_D94U9rguoRtCUh5hZdfcgEE7999SG7KSS1R32gbmq',
  },
  {
    quote:
      'The bespoke itinerary was flawless. We wanted a trip focused on bird photography and quiet moments, and they delivered exactly that. Truly the experts of authentic African safaris.',
    name: 'Markus Weber',
    location: 'Munich, Germany',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDRcYLtsIkom74XG5p6jZlqurQPzqTawzyhwQ6VXrrML45M24gF6_2XWFN9-a94dapRlzTqElUJ7UjxxyQuKE6SnAbUzrCjiczFOjpgbOZusViypZ-6K0Dl10Ox4FWyVTMexcAn2w_0U7rOHLYR3auBrDSGUthdHkhP48mSb2CswDWp9H7Dv5ckSe4T5Y2tLLzjuHSCKkT3ed6U1caTHsIIeNswwZpmrf8GSvDrf3zz5FL90q6PW_Z',
  },
]

const GALLERY = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsIQ0laWmQuJ5AQGU-MZ2072mfZEQdaQkkaUsq6_PkZkYtTfEY95tkb3PZ0BKDnIRu9l8YS6HRCPPCiwVBk9g1NlUeazkm_csfHTeaoFhcTWB__xcH4ynGYcPq8xYCfhT4tLUmLcu78V_2ezyAdb1WRRfGHQIx2olP-2eIcQ6q20ZEMoyahkAK9YlASM-bRXwgspPT4PgcaZJlpfz027neyCw1iCq2a7fhmM3S3LRoWY1G8skxGXQ3',
    alt: 'Pink flamingos wading in the shallow alkaline waters of Lake Manyara at sunrise.',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuH0tePT8qXq_sHGAE4U3Wpha89bXX6gx6ymIKtzx6ySqYp405qvn7vRhJ6rtisiulxyHtycuBJapgtHaAnHfJvpqWCJDYXHShwbcvIdtnfC4IUwzUNXFLjsMLyPLGFNfplUR2nTi0Eduedi6wzDHL1o4hk9nGkuPGdPC8lACGsD6Jn0qNLmtJrXqWp-QWsiyglOScAe-CdT2X9NCU-Qw1lX9rJVKr9siAAV72jk3p8Ii-RlCwBl3T',
    alt: 'A massive herd of wildebeest crossing the Mara River during the Great Migration.',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpGD1x2a6nBVYSpCjkjQDx3K3ZZD2PlILrve174tC3eyqNGnv9ODFvhlkC6K4kiBjd7VaJXRlrMhPLIGQVfCASltN5NrgcMsk_QuIhZ7BNj50Cs2Z3ACAxBFhtDncWsywDgS54SqpzhRYEGNPTxLCjvWTW82gCTzfdZxhd5fMpRLKles2hCVupN0WSG2PYgnniyzAZQyuBl21E24Am7eGeQkoHB4SjaTriJxjuD05MXIji1PQpVNWL',
    alt: 'A luxury canvas safari tent glowing with lantern light under the Milky Way.',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCtN0NgbmLUwPgXkv2bz7m5k4NdWFw6BqiXNYnVLiVRIZEYGk29NwE-yM_9XpdsdfAX3t09Vl-BgSfeCic1dLLcFfnRwXtGWWxQd-WcQ8-7nt_LgOtrJUBrTsofGxzfKwbpVFLLPIy6krV2Z4TtCtKLDxz0x3PJ6F1kl5TNc5HiMPQTRDxqRk1CgFFSJ6bJsYsIkCyLr5elPs5nAMO18mxUxO8CgiVDSOevWPfdBM337-7dygXpJNl',
    alt: 'A cheetah cub with large expressive eyes sitting in dew-covered grass.',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnT1UDxNruXxK2N_ZyiXvfqpFmDOChCGzdi_ALZSSxsdOMkNCpeqYkKywimRGndbUhdEmd2PEbtrwUB0SpE0GkwQCxkwAu5eeXztZRLJW4o0vDrU5C0azHpA2e-q4p0nHZMDSZMsYF7xfLezL8n9tjjgXUiqZws_ZwzwvEGwa0_mHNhBg9nMUUw7fHXT1kPt8LG-76w92Jc47wnLEmivr3d4jJNKGlTdKYWnCs6ZcEs9w2u9g5dXC5',
    alt: 'A Maasai warrior in traditional red shuka robes overlooking the savanna at sunset.',
  },
]

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-screen min-h-[640px] w-full flex items-center justify-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMR8vztW8A14neiYV4bSqSlUMuo1Y9-mwfvWjE4CS0mK-8UA2Exzvz2F3I9sG-hFGJblKAlfOaZBBbnZqeDi0ivQhv_4XdzmiDeAA7SaAoD1Vbohvb_KalozG-peJSBYM_iDUlD4JEMW3paUXvdttilCgtcnAE5GUg_AiBUFlosW2GqV24mFAx3gROTnY6wB7wJfGBPDixNHiweh10u0W2I2xJeSNIcMvacvsGk_NOXRiC7ZdnPoFM"
          alt="A lion standing on a rock outcropping in the Serengeti at golden hour, overlooking the savanna."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 text-center px-5 max-w-4xl">
          <h1 className="font-display-lg text-[40px] md:text-display-lg text-white mb-6">
            Experience the Wild Heart of Tanzania
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Bespoke, authentic safaris tailored to your sense of adventure. Discover the untamed beauty of Africa's
            most iconic landscapes with expert local guides.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/about#contact"
              className="bg-savanna-green text-white px-10 py-4 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors min-h-[44px] flex items-center justify-center"
            >
              Book Your Safari
            </Link>
            <Link
              to="/destinations"
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-lg font-label-md text-label-md hover:bg-white/20 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Explore Destinations
            </Link>
          </div>
        </div>

        <CaretDoubleDown
          size={28}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white animate-bounce"
          aria-hidden
        />
      </section>

      {/* Why Pande Wilderness Safari */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">Our Expertise</span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Why Pande Wilderness Safari?
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {PILLARS.map((pillar, i) => (
            <Reveal
              key={pillar.title}
              delay={i * 100}
              className="bg-surface-container-low p-10 rounded-xl shadow-[0_10px_30px_-10px_rgba(45,45,45,0.08)] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="bg-savanna-green/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <pillar.icon size={30} className="text-savanna-green" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-4">{pillar.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{pillar.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Signature Safari Packages */}
      <section className="py-20 md:py-section-gap bg-surface-container">
        <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto">
          <Reveal className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">
                Curated Experiences
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                Signature Safari Packages
              </h2>
            </div>
            <Link to="/safaris" className="text-savanna-green font-label-md flex items-center gap-2 group">
              View All Safaris
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {signaturePackages.map((safari, i) => (
              <Reveal key={safari.id} delay={i * 80}>
                <SafariCard safari={safari} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-section-gap bg-deep-earth text-white overflow-hidden relative">
        <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto relative z-10">
          <Reveal className="max-w-3xl">
            <span className="text-savanna-green font-label-md tracking-widest uppercase mb-4 block">
              Traveler Stories
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-16">
              Witnessing the magic of the wild through our guests' eyes.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {TESTIMONIALS.map((testimonial, i) => (
              <Reveal key={testimonial.name} delay={i * 100} className="space-y-6">
                <div className="flex text-golden-sun" aria-hidden>
                  {'★★★★★'}
                </div>
                <blockquote className="font-headline-md text-2xl md:text-3xl italic font-normal leading-relaxed">
                  “{testimonial.quote}”
                </blockquote>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={`Portrait of ${testimonial.name}`}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover bg-sand-stone/20"
                  />
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-white/60">{testimonial.location}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Strip */}
      <section className="py-12 bg-surface-container-lowest overflow-hidden">
        <div className="flex gap-4 px-5">
          {GALLERY.map((photo) => (
            <div key={photo.src} className="w-64 md:w-80 h-48 md:h-60 shrink-0 rounded-lg overflow-hidden">
              <img src={photo.src} alt={photo.alt} loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="bg-surface-container-low rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
              Join the Quest
            </h2>
            <p className="text-on-surface-variant max-w-md">
              Receive exclusive travel guides, safari tips, and early access to seasonal offers directly in your
              inbox.
            </p>
          </div>
          <form
            className="flex w-full md:w-auto max-w-md gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              required
              placeholder="Your email address"
              className="min-h-[44px] flex-1 bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
            <button
              type="submit"
              className="min-h-[44px] bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </Reveal>
      </section>
    </>
  )
}
