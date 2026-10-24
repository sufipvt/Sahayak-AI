import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, ChevronRight, Clock } from 'lucide-react'
import { Page, Card, StatusBadge, Tag } from '../components/ui.jsx'
import { pastChats, savedIds, schemes } from '../data/sample.js'

function Feedback({ initial }) {
  const [v, setV] = useState(initial)
  return (
    <span className="flex gap-1">
      <button onClick={() => setV('up')} className={`p-2 rounded-lg ${v === 'up' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`} aria-label="Helpful">
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button onClick={() => setV('down')} className={`p-2 rounded-lg ${v === 'down' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-slate-100'}`} aria-label="Not helpful">
        <ThumbsDown className="w-4 h-4" />
      </button>
    </span>
  )
}

export default function History() {
  const saved = savedIds.map((id) => schemes.find((s) => s.id === id))

  return (
    <Page title="History & saved schemes" subtitle="Pick up where you left off.">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-saffron-600" /> Past chats</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {pastChats.map((c, i) => (
              <li key={c.title} className="py-3 flex items-center gap-3">
                <Link to="/results" className="flex-1 min-w-0 group">
                  <p className="font-semibold text-navy-900 group-hover:text-navy-600 truncate">{c.title}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.date} · {c.results} schemes found</p>
                </Link>
                <Feedback initial={i === 0 ? 'up' : i === 3 ? 'down' : null} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><Bookmark className="w-5 h-5 text-saffron-600" /> Saved schemes</h2>
          <ul className="mt-4 space-y-3">
            {saved.map((s, i) => (
              <li key={s.id} className="p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <Link to={`/scheme/${s.id}`} className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1"><Tag>{s.category}</Tag><StatusBadge status={s.status} /></div>
                  <p className="font-semibold text-navy-900">{s.short}</p>
                  <p className="text-xs text-slate-500">Last updated {s.updated}</p>
                </Link>
                <Feedback initial={i < 2 ? 'up' : null} />
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  )
}
