import { Link } from 'react-router-dom'
import { MapPin, Phone, EnvelopeSimple, PaperPlaneTilt, InstagramLogo, FacebookLogo, WhatsappLogo } from '@phosphor-icons/react'
import { contact } from '../config/contact'

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-5 md:px-margin-desktop py-16 md:py-section-gap max-w-container-max mx-auto">
        <div>
          <div className="font-headline-md text-headline-md text-savanna-green mb-6">Pande Wilderness Safari</div>
          <p className="text-on-surface-variant font-body-md mb-6">
            Crafting authentic Tanzanian memories since 2008. Your window into the wild heart of Africa.
          </p>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <a href={contact.social.instagram || '#'} aria-label="Instagram" className="hover:text-savanna-green transition-colors">
              <InstagramLogo size={22} />
            </a>
            <a href={contact.social.facebook || '#'} aria-label="Facebook" className="hover:text-savanna-green transition-colors">
              <FacebookLogo size={22} />
            </a>
            <a href={contact.social.whatsapp || '#'} aria-label="WhatsApp" className="hover:text-savanna-green transition-colors">
              <WhatsappLogo size={22} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-3">
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/safaris">Safaris</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/destinations">Destinations</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/experiences">Experiences</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/about">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">Legal</h4>
          <ul className="space-y-3">
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">Terms of Service</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">Park Regulations</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">Sitemap</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-on-surface-variant">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <span>{contact.address}</span>
            </li>
            <li className="flex items-center gap-2 text-on-surface-variant">
              <Phone size={18} className="shrink-0" />
              <a className="hover:text-terracotta transition-colors" href={`tel:${contact.phoneHref}`}>{contact.phone}</a>
            </li>
            <li className="flex items-center gap-2 text-on-surface-variant">
              <EnvelopeSimple size={18} className="shrink-0" />
              <a className="hover:text-terracotta transition-colors" href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          </ul>
          <form className="flex" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              className="bg-ivory-base border border-sand-stone rounded-l-lg px-4 py-2 w-full min-h-[44px] focus:outline-none focus:ring-1 focus:ring-savanna-green"
              placeholder="Your email"
              type="email"
              required
            />
            <button
              type="submit"
              className="bg-savanna-green text-on-primary px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity min-w-[44px] min-h-[44px] cursor-pointer"
              aria-label="Subscribe to newsletter"
            >
              <PaperPlaneTilt size={20} />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-surface-variant py-8 text-center px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <p className="text-on-surface-variant text-label-sm">© {new Date().getFullYear()} Pande Wilderness Safari. All Rights Reserved. Certified Safari Operators.</p>
      </div>
    </footer>
  )
}
