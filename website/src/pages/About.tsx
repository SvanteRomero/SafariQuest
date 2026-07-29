import { useState, type FormEvent } from 'react'
import { MapPin, Phone, EnvelopeSimple, ShieldCheck, Users, Binoculars, CheckCircle } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'

const STATS = [
  { icon: ShieldCheck, value: '15+', label: 'Years Guiding Tanzania' },
  { icon: Users, value: '2,400+', label: 'Travelers Hosted' },
  { icon: Binoculars, value: '100%', label: 'Licensed Guide Team' },
]

export function About() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire up to a real backend/CRM once one exists.
    setSubmitted(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative h-[420px] md:h-[500px] flex items-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpGD1x2a6nBVYSpCjkjQDx3K3ZZD2PlILrve174tC3eyqNGnv9ODFvhlkC6K4kiBjd7VaJXRlrMhPLIGQVfCASltN5NrgcMsk_QuIhZ7BNj50Cs2Z3ACAxBFhtDncWsywDgS54SqpzhRYEGNPTxLCjvWTW82gCTzfdZxhd5fMpRLKles2hCVupN0WSG2PYgnniyzAZQyuBl21E24Am7eGeQkoHB4SjaTriJxjuD05MXIji1PQpVNWL"
          alt="A luxury canvas safari tent glowing with lantern light beneath the Milky Way."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto text-center">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-4">About Us</h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl mx-auto">
            Crafting authentic Tanzanian memories since 2008 — our story, our guides, and how to reach us.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">Our Story</span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6">
            Born in Arusha, built for the bush.
          </h2>
          <p className="text-on-surface-variant font-body-lg leading-relaxed mb-4">
            Pande Wilderness Safari started in 2008 as a two-vehicle outfit run by guides who grew up tracking game
            across the Serengeti. Today we're still owner-guided, still Tanzanian-run, and still obsessed with
            getting every itinerary right down to the last watering hole.
          </p>
          <p className="text-on-surface-variant font-body-lg leading-relaxed">
            We work exclusively with silver- and gold-level certified guides, invest directly in the communities we
            pass through, and keep every group small enough to feel like your own private expedition.
          </p>
        </Reveal>
        <Reveal delay={100} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-surface-container-low rounded-xl p-6 text-center">
              <stat.icon size={28} className="text-savanna-green mx-auto mb-3" />
              <p className="font-headline-md text-headline-md text-savanna-green">{stat.value}</p>
              <p className="text-label-sm text-on-surface-variant mt-1">{stat.label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 md:py-section-gap bg-surface-container-low px-5 md:px-margin-desktop scroll-mt-24">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <Reveal>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6">
              Get in Touch
            </h2>
            <p className="text-on-surface-variant font-body-lg leading-relaxed mb-8">
              Ready to book, or still deciding? Our safari specialists reply within one business day.
            </p>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-on-surface-variant">
                <MapPin size={22} className="text-savanna-green shrink-0 mt-0.5" />
                <span>Post 44, Arusha-Dodoma Rd, Arusha, Tanzania</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant">
                <Phone size={22} className="text-savanna-green shrink-0" />
                <a className="hover:text-savanna-green transition-colors" href="tel:+255784123456">
                  +255 784 123 456
                </a>
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant">
                <EnvelopeSimple size={22} className="text-savanna-green shrink-0" />
                <a className="hover:text-savanna-green transition-colors" href="mailto:hello@serengetiquest.com">
                  hello@serengetiquest.com
                </a>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={100} className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center text-center py-10" role="status" aria-live="polite">
                <CheckCircle size={40} className="text-savanna-green mb-4" />
                <p className="font-headline-md text-headline-md mb-2">Message sent</p>
                <p className="text-on-surface-variant">
                  Thank you — a safari specialist will reply to your email within one business day.
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="contact-name" className="block font-label-md text-label-md mb-2">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block font-label-md text-label-md mb-2">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block font-label-md text-label-md mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  )
}
