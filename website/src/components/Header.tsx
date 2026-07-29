import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Safaris', to: '/safaris' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'About Us', to: '/about' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-label-md text-label-md transition-colors ${
      isActive
        ? 'text-savanna-green border-b-2 border-savanna-green pb-1'
        : 'text-on-surface-variant hover:text-savanna-green'
    }`

  return (
    <header className="fixed top-0 w-full z-50 bg-ivory-base/80 backdrop-blur-md shadow-sm">
      <nav className="flex justify-between items-center px-5 md:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
        <NavLink
          to="/"
          className="font-headline-md text-headline-md font-bold text-savanna-green"
          onClick={() => setMenuOpen(false)}
        >
          Pande Wilderness Safari
        </NavLink>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-11 h-11 text-on-surface cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden bg-ivory-base border-t border-surface-variant px-5 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center ${
                  isActive ? 'text-savanna-green bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
