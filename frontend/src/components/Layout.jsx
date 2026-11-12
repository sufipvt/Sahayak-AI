import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Menu, X, Info, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../auth.jsx'

// "who" decides who sees the link: everyone, logged-in users, or admins.
const allLinks = [
  { to: '/', label: 'Home', who: 'all' },
  { to: '/results', label: 'Find schemes', who: 'all' },
  { to: '/upload', label: 'Upload', who: 'all' },
  { to: '/centres', label: 'Help centres', who: 'all' },
  { to: '/history', label: 'History', who: 'user' },
  { to: '/profile', label: 'Profile', who: 'user' },
  { to: '/architecture', label: 'Architecture', who: 'all' },
  { to: '/admin', label: 'Admin', who: 'admin' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const links = allLinks.filter((l) =>
    l.who === 'all' || (l.who === 'user' && user) || (l.who === 'admin' && user?.role === 'admin')
  )

  const onLogout = () => {
    logout()
    navigate('/')
  }

  // The Login button for guests; the name + Logout for logged-in users.
  const account = (mobile) =>
    user ? (
      <div className={`flex items-center gap-2 ${mobile ? 'mt-2 justify-between' : 'ml-2'}`}>
        <span className="flex items-center gap-1.5 text-sm text-navy-100" title={user.email}>
          <UserRound className="w-4 h-4" /> {user.name}
        </span>
        <button onClick={onLogout} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/20 text-sm font-semibold hover:bg-white/10">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    ) : (
      <Link to="/login" className={`px-4 py-2 rounded-lg bg-saffron-500 text-navy-900 font-semibold hover:bg-saffron-400 ${mobile ? 'mt-2 text-center' : 'ml-2'}`}>
        Login
      </Link>
    )

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

          <nav className="hidden xl:flex items-center gap-1 ml-auto whitespace-nowrap">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            {account(false)}
          </nav>

          <button className="xl:hidden ml-auto p-2 rounded-lg hover:bg-white/10" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="xl:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            {account(true)}
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
            Sahayak gives information only. The final decision rests with the concerned government department.
          </p>
          <p className="text-navy-200">© 2026 Sahayak · B.Tech Final Year Project</p>
        </div>
      </footer>
    </div>
  )
}
