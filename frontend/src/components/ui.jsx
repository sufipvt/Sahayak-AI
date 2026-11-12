import { Link } from 'react-router-dom'
import { CheckCircle2, CircleHelp, CircleDot, CircleX, Building2, ShieldAlert } from 'lucide-react'

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
  'Not eligible': { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: CircleX },
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

// Shown when a team member has not yet checked the scheme's rules.
export function UnverifiedNote() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500" title="The eligibility rules for this scheme have not been checked against the official page yet.">
      <ShieldAlert className="w-3.5 h-3.5" /> Rules not yet verified
    </span>
  )
}

export function Citation({ n, title }) {
  return (
    <span
      title={title || `Source [${n}]`}
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

// One result of the eligibility check (from /api/chat or /api/schemes/match).
export function SchemeCard({ match }) {
  return (
    <Card className="p-4 hover:shadow-md hover:border-navy-200 transition">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Tag>{match.category}</Tag>
        <StatusBadge status={match.status} />
      </div>
      <Link to={`/scheme/${match.scheme_id}`} className="font-bold text-navy-900 hover:text-navy-600 leading-snug">
        {match.name}
      </Link>
      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 shrink-0" /> {match.ministry}
      </p>

      {match.why.length > 0 && (
        <ul className="mt-2 text-sm text-slate-700 space-y-0.5">
          {match.why.map((reason) => (
            <li key={reason} className="flex gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {reason}</li>
          ))}
        </ul>
      )}
      {match.missing.length > 0 && (
        <p className="mt-2 text-sm text-amber-800">Still needed: {match.missing.join('; ')}</p>
      )}
      {match.failed?.length > 0 && (
        <p className="mt-2 text-sm text-rose-700">{match.failed.join(' ')}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {match.rules_verified === false ? <UnverifiedNote /> : <span />}
        <Link to={`/scheme/${match.scheme_id}`} className="text-sm font-semibold text-saffron-700 hover:text-saffron-600">
          View details →
        </Link>
      </div>
    </Card>
  )
}
