import { useState } from 'react'
import { Users, MessageSquare, Timer, Star, RefreshCw, Plus, PenLine, Minus, Check, Target, CalendarClock } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'
import { adminStats, refreshRun, evaluation } from '../data/sample.js'

const statIcons = [Users, MessageSquare, Timer, Star]

export default function Admin() {
  const [approved, setApproved] = useState([])

  return (
    <Page title="Admin dashboard" subtitle="Usage, data freshness and evaluation targets (sample numbers).">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((s, i) => {
          const Icon = statIcons[i]
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{s.label}</p>
                <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 grid place-items-center"><Icon className="w-4 h-4" /></span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy-900">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.delta}</p>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-saffron-600" /> Weekly data refresh</h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> Last run: {refreshRun.lastRun}</p>
            </div>
            <Btn variant="accent"><RefreshCw className="w-4 h-4" /> Refresh now</Btn>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-700 flex items-center justify-center gap-1"><Plus className="w-5 h-5" />{refreshRun.added}</p>
              <p className="text-xs font-semibold text-emerald-700">new</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-700 flex items-center justify-center gap-1"><PenLine className="w-5 h-5" />{refreshRun.changed}</p>
              <p className="text-xs font-semibold text-amber-700">changed</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-red-700 flex items-center justify-center gap-1"><Minus className="w-5 h-5" />{refreshRun.removed}</p>
              <p className="text-xs font-semibold text-red-700">removed</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Scheme</th>
                  <th className="py-2 pr-3 font-semibold">Section</th>
                  <th className="py-2 pr-3 font-semibold hidden sm:table-cell">Change</th>
                  <th className="py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {refreshRun.changes.map((c, i) => (
                  <tr key={c.scheme} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-semibold text-navy-900">{c.scheme}</td>
                    <td className="py-3 pr-3 text-slate-600">{c.field}</td>
                    <td className="py-3 pr-3 text-slate-600 hidden sm:table-cell">{c.change}</td>
                    <td className="py-3 text-right">
                      {approved.includes(i) ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><Check className="w-4 h-4" /> Approved</span>
                      ) : (
                        <button onClick={() => setApproved([...approved, i])} className="px-3 py-1.5 rounded-lg bg-navy-800 text-white font-semibold hover:bg-navy-700">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2"><Target className="w-5 h-5 text-saffron-600" /> Evaluation</h2>
          <p className="text-sm text-slate-500 mt-1">Target values on the test set</p>
          <div className="mt-5 space-y-5">
            {evaluation.map((e) => (
              <div key={e.metric}>
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-navy-900">{e.metric}</p>
                  <p className="font-extrabold text-navy-800">{e.display}</p>
                </div>
                <div className="mt-1.5 h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-navy-600 to-saffron-500" style={{ width: `${e.target * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{e.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  )
}
