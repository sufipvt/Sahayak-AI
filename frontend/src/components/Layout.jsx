import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Menu, X, Info } from 'lucide-react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/results', label: 'Find schemes' },
  { to: '/upload', label: 'Upload' },
  { to: '/centres', label: 'Help centres' },
  { to: '/history', label: 'History' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/admin', label: 'Admin' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-[15px] font-medium transition ${
      isActive ? 'bg-white/15 text-white' : 'text-navy-100 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-1 bg-gradient-to-r from-saffron-500 via-white to-emerald-600" />
      <header className="bg-navy-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-saffron-500 grid place-items-center">
              <Compass className="w-5 h-5 text-navy-900" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">Sahayak</span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-saffron-500/20 text-saffron-200 border border-saffron-400/40">
            <Info className="w-3 h-3" /> Frontend prototype · backend not connected
          </span>

          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/login" className="ml-2 px-4 py-2 rounded-lg bg-saffron-500 text-navy-900 font-semibold hover:bg-saffron-400">
              Login
            </Link>
          </nav>

          <button className="lg:hidden ml-auto p-2 rounded-lg hover:bg-white/10" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="lg:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
            <span className="sm:hidden self-start mb-2 text-xs font-semibold px-2 py-1 rounded-full bg-saffron-500/20 text-saffron-200">
              Frontend prototype · backend not connected
            </span>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/login" className="mt-2 px-4 py-2 rounded-lg bg-saffron-500 text-navy-900 font-semibold text-center">
              Login
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-900 text-navy-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-sm">
          <p className="flex items-center gap-2">
            <Info className="w-4 h-4 text-saffron-400 shrink-0" />
            When available, Sahayak guidance does not replace official eligibility decisions.
          </p>
          <p className="text-navy-200">© 2026 Sahayak · B.Tech Final Year Project</p>
        </div>
      </footer>
    </div>
  )
}
