import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import navLinks from '../data/navLinks.js'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="w-full bg-navy text-white" aria-label="Primary">
      <div className="flex items-center justify-between px-4 md:px-6">
        <button
          className="py-3 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="primary-nav-links"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation</span>
        </button>

        <ul
          id="primary-nav-links"
          className={`${
            open ? 'flex' : 'hidden'
          } w-full flex-col md:flex md:w-auto md:flex-row md:items-center`}
        >
          {navLinks.map((link, i) => (
            <li key={link.href} className="border-t border-white/10 md:border-t-0">
              <a
                href={link.href}
                className={`block px-4 py-3 text-xs font-bold tracking-wide hover:bg-white/10 ${
                  i === 0 ? 'md:pl-0' : ''
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
