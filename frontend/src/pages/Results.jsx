import { Link } from 'react-router-dom'
import { Volume2, Send, Mic, Compass, UserRound, Pencil, BookOpen } from 'lucide-react'
import { Page, Card, SchemeCard, Citation } from '../components/ui.jsx'
import { sampleProfile, schemes, resultIds, sources, followUps } from '../data/sample.js'

export default function Results() {
  const results = resultIds.map((id) => schemes.find((s) => s.id === id))

  return (
    <Page>
      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
        {/* Left: user message + profile */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="flex gap-3">
            <span className="w-10 h-10 rounded-full bg-slate-200 grid place-items-center shrink-0">
              <UserRound className="w-5 h-5 text-slate-600" />
            </span>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 mb-1">You</p>
              <p className="text-[17px] text-slate-800">{sampleProfile.description}</p>
            </div>
          </div>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-900">Profile used</p>
              <Link to="/profile" className="text-xs text-navy-600 flex items-center gap-1 hover:underline">
                <Pencil className="w-3 h-3" /> Edit
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sampleProfile.fields.map((f) => (
                <span key={f.label} className="text-xs px-2 py-1 rounded-lg bg-navy-50 text-navy-800 font-medium">{f.value}</span>
              ))}
            </div>
          </Card>
          <Card className="p-4 hidden lg:block">
            <p className="text-sm font-semibold text-navy-900 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Sources</p>
            <ul className="mt-2 space-y-1.5">
              {sources.slice(0, 7).map((s) => (
                <li key={s.n} className="flex gap-2 text-xs text-slate-600">
                  <Citation n={s.n} /> <span>{s.title} — <i>{s.section}</i></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right: assistant reply */}
        <div className="flex gap-3">
          <span className="w-10 h-10 rounded-full bg-navy-900 grid place-items-center shrink-0">
            <Compass className="w-5 h-5 text-saffron-400" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="bg-navy-50 border border-navy-100 rounded-2xl rounded-tl-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-navy-600 mb-1">Sahayak</p>
                  <p className="text-[17px] text-navy-900">
                    Based on your profile, I found <b>5 schemes</b> that may apply to you. Two look clearly eligible; others need a quick check.
                  </p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-navy-200 text-navy-800 text-sm font-semibold hover:bg-navy-100">
                  <Volume2 className="w-4 h-4" /> Listen
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              {results.map((s) => <SchemeCard key={s.id} scheme={s} />)}
            </div>

            <Card className="mt-6 p-4">
              <p className="text-sm font-semibold text-slate-600 mb-2">Ask a follow-up</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {followUps.map((q) => (
                  <Link
                    key={q}
                    to={q.includes('centre') ? '/centres' : '/scheme/nsp-scholarship'}
                    className="text-sm px-3 py-1.5 rounded-full border border-saffron-200 bg-saffron-50 text-saffron-700 hover:bg-saffron-100"
                  >
                    {q}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 border border-slate-300 rounded-xl p-1.5 pl-4 focus-within:ring-2 focus-within:ring-saffron-300">
                <input className="flex-1 outline-none text-base py-2 min-w-0" placeholder="Type your question…" />
                <Link to="/voice" className="w-10 h-10 rounded-lg grid place-items-center text-saffron-700 hover:bg-saffron-50" aria-label="Speak">
                  <Mic className="w-5 h-5" />
                </Link>
                <button className="w-10 h-10 rounded-lg grid place-items-center bg-navy-800 text-white hover:bg-navy-700" aria-label="Send">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  )
}
