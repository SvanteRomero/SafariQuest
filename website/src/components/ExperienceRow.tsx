import { Link } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import type { Experience } from '../data/experiences'
import { Reveal } from './Reveal'

interface ExperienceRowProps {
  experience: Experience
  reverse?: boolean
}

export function ExperienceRow({ experience, reverse = false }: ExperienceRowProps) {
  return (
    <section className={`py-16 md:py-20 px-5 md:px-margin-desktop ${reverse ? 'bg-surface-container-low' : 'bg-surface'}`}>
      <Reveal
        className={`max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${
          reverse ? 'md:[&>*:first-child]:order-2' : ''
        }`}
      >
        <div className="relative rounded-xl overflow-hidden aspect-4/3">
          <img
            src={experience.image}
            alt={experience.imageAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {experience.badge && (
            <div className="absolute top-4 left-4 bg-savanna-green text-on-primary px-3 py-1 rounded-full text-label-sm font-label-md uppercase tracking-wider">
              {experience.badge}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-md text-on-surface mb-4">{experience.title}</h2>
          <p className="text-on-surface-variant font-body-lg leading-relaxed mb-6">{experience.description}</p>

          {experience.quote && (
            <blockquote className="border-l-4 border-golden-sun pl-4 italic text-on-surface-variant mb-6">
              “{experience.quote}”
            </blockquote>
          )}

          {experience.tags && (
            <ul className="flex flex-wrap gap-3 mb-6">
              {experience.tags.map((tag) => (
                <li
                  key={tag}
                  className="flex items-center gap-2 text-label-sm text-on-surface-variant bg-surface-container-lowest border border-sand-stone px-3 py-1.5 rounded-full"
                >
                  <Star size={14} className="text-savanna-green" />
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {experience.stats && (
            <div className="flex gap-10 mb-6">
              {experience.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-headline-md text-headline-md text-savanna-green">{stat.value}</p>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/safaris"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-lg border border-savanna-green text-savanna-green font-label-md hover:bg-savanna-green hover:text-on-primary transition-colors"
          >
            Related Safaris
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
