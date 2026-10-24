import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Volume2, Bookmark, MapPin, Gift, ClipboardCheck, FileText, ListOrdered, ExternalLink, Clock, ArrowLeft, Building2, CheckSquare, Square } from 'lucide-react'
import { Page, Card, Btn, StatusBadge, Tag, Citation } from '../components/ui.jsx'
import { getScheme } from '../data/sample.js'

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-600 grid place-items-center"><Icon className="w-4 h-4" /></span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export default function SchemeDetail() {
  const scheme = getScheme(useParams().id)
  const [checked, setChecked] = useState([0, 1])
  const toggle = (i) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))

  return (
    <Page>
      <Link to="/results" className="inline-flex items-center gap-1 text-navy-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-navy-50">
        <div className="flex flex-wrap gap-2"><Tag>{scheme.category}</Tag><StatusBadge status={scheme.status} /></div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-navy-900">{scheme.name}</h1>
        <p className="mt-2 text-slate-600 flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {scheme.ministry}</p>
        <p className="mt-3 text-lg text-slate-700 max-w-3xl">{scheme.summary}</p>
        <p className="mt-3 text-sm text-slate-500 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Last updated {scheme.updated}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Btn variant="primary"><Volume2 className="w-4 h-4" /> Listen</Btn>
          <Btn variant="outline"><Bookmark className="w-4 h-4" /> Save</Btn>
          <Btn to="/centres" variant="accent"><MapPin className="w-4 h-4" /> Find nearest centre</Btn>
        </div>
      </Card>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Section icon={Gift} title="Benefits">
          <ul className="space-y-2">
            {scheme.benefits.map((b) => (
              <li key={b} className="flex gap-2 text-slate-700"><span className="text-saffron-500 font-bold">•</span>{b}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-1.5">{scheme.citations.map((n) => <Citation key={n} n={n} />)}</div>
        </Section>

        <Section icon={ClipboardCheck} title="Eligibility">
          <ul className="space-y-2">
            {scheme.eligibility.map((e) => (
              <li key={e} className="flex gap-2 text-slate-700"><span className="text-emerald-600 font-bold">✓</span>{e}</li>
            ))}
          </ul>
          <p className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">
            <b>For you:</b> {scheme.why}
          </p>
        </Section>

        <Section icon={FileText} title="Documents needed">
          <p className="text-sm text-slate-500 mb-3">Tick what you already have ({checked.length}/{scheme.documents.length})</p>
          <ul className="space-y-2">
            {scheme.documents.map((d, i) => (
              <li key={d}>
                <button onClick={() => toggle(i)} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50">
                  {checked.includes(i)
                    ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                    : <Square className="w-5 h-5 text-slate-400" />}
                  <span className={checked.includes(i) ? 'text-slate-500 line-through' : 'text-slate-800'}>{d}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={ListOrdered} title="How to apply">
          <ol className="space-y-3">
            {scheme.steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-navy-800 text-white text-sm font-bold grid place-items-center shrink-0">{i + 1}</span>
                <span className="text-slate-700 pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Card className="mt-6 p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-900">Official source</p>
          <a href={scheme.source} target="_blank" rel="noreferrer" className="text-navy-600 hover:underline inline-flex items-center gap-1 break-all">
            {scheme.source} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-sm text-slate-500 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Last updated {scheme.updated} · Sample data</p>
      </Card>
    </Page>
  )
}
