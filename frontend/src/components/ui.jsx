import { Link } from 'react-router-dom'
import { CheckCircle2, CircleHelp, CircleDot, Clock, Building2 } from 'lucide-react'

export function Page({ title, subtitle, children, wide = true }) {
  return (
    <div className={`${wide ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 py-8 sm:py-10`}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-600 text-lg">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
}

const statusStyles = {
  Eligible: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  'Likely eligible': { cls: 'bg-sky-50 text-sky-700 border-sky-200', Icon: CircleDot },
  'Needs confirmation': { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: CircleHelp },
}

export function StatusBadge({ status }) {
  const { cls, Icon } = statusStyles[status] || statusStyles['Needs confirmation']
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon className="w-3.5 h-3.5" /> {status}
    </span>
  )
}

export function Tag({ children }) {
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-700">{children}</span>
}

export function Citation({ n }) {
  return (
    <span
      title={`Source [${n}]`}
      className="inline-grid place-items-center min-w-6 h-6 px-1 text-xs font-bold rounded-md bg-saffron-100 text-saffron-700 border border-saffron-200"
    >
      [{n}]
    </span>
  )
}

export function Btn({ to, onClick, variant = 'primary', className = '', children, type = 'button' }) {
  const styles = {
    primary: 'bg-navy-800 text-white hover:bg-navy-700',
    accent: 'bg-saffron-500 text-navy-900 hover:bg-saffron-400',
    outline: 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50',
    ghost: 'text-navy-700 hover:bg-navy-50',
  }
  const cls = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition ${styles[variant]} ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type={type} onClick={onClick} className={cls}>{children}</button>
}

export function SchemeCard({ scheme }) {
  return (
    <Card className="p-5 hover:shadow-md hover:border-navy-200 transition">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Tag>{scheme.category}</Tag>
        <StatusBadge status={scheme.status} />
      </div>
      <Link to={`/scheme/${scheme.id}`} className="text-lg font-bold text-navy-900 hover:text-navy-600 leading-snug">
        {scheme.name}
      </Link>
      <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
        <Building2 className="w-4 h-4 shrink-0" /> {scheme.ministry}
      </p>
      <p className="mt-3 text-[15px] text-slate-700">
        <span className="font-semibold text-navy-800">Why you qualify: </span>
        {scheme.why}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {scheme.citations.map((n) => <Citation key={n} n={n} />)}
          <span className="ml-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Last updated {scheme.updated}
          </span>
        </div>
        <Link to={`/scheme/${scheme.id}`} className="text-sm font-semibold text-saffron-700 hover:text-saffron-600">
          View details →
        </Link>
      </div>
    </Card>
  )
}
