import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Card, formatDate } from '../ui.jsx'
import { getAdminSchemes, errorMessage } from '../../api.js'

// All schemes with their saved official text. A scheme whose page changed
// in a refresh (and is not verified again yet) is highlighted in amber.
// reloadKey changes after each refresh, which loads the list again.
export default function SchemesPanel({ reloadKey }) {
  const [schemes, setSchemes] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminSchemes().then(setSchemes).catch((e) => setError(errorMessage(e)))
  }, [reloadKey])

  const recheck = schemes?.filter((s) => s.needs_recheck) || []

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-saffron-600" /> Schemes
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        {schemes ? `${schemes.length} schemes in data/schemes.json.` : 'Loading…'}
        {recheck.length > 0 && ` ${recheck.length} need a rules re-check because their official page changed.`}
      </p>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-4 overflow-x-auto">
        {schemes && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Scheme</th>
                <th className="py-2 pr-3 font-semibold">Source</th>
                <th className="py-2 pr-3 font-semibold">Last fetched</th>
                <th className="py-2 pr-3 font-semibold">Fingerprint</th>
                <th className="py-2 font-semibold">Rules</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.scheme_id} className={`border-b border-slate-100 align-top ${s.needs_recheck ? 'bg-amber-50' : ''}`}>
                  <td className="py-2 pr-3">
                    <Link to={`/scheme/${s.scheme_id}`} className="font-semibold text-navy-900 hover:text-navy-600">{s.name}</Link>
                    <p className="text-xs text-slate-500">{s.scheme_id} · {s.sections} sections</p>
                    {s.needs_recheck && (
                      <p className="mt-1 text-xs font-semibold text-amber-800 flex items-center gap-1">
                        <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                        Page changed {formatDate(s.last_change.at)} ({s.last_change.by}): rules may need re-check
                      </p>
                    )}
                  </td>
                  <td className="py-2 pr-3">{s.source}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{s.source === 'pdf' ? 'local PDF' : formatDate(s.fetched_at)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{s.content_hash || '–'}</td>
                  <td className="py-2 whitespace-nowrap">
                    {s.verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-4 h-4" /> Verified</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500"><ShieldAlert className="w-4 h-4" /> Not verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}
