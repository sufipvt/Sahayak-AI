import { useState } from 'react'
import { Pencil, CheckCircle2, Sparkles, Quote, ShieldCheck } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'
import { sampleProfile } from '../data/sample.js'

export default function Profile() {
  const [consent, setConsent] = useState(true)

  return (
    <Page title="Your profile" subtitle="Check what we understood before we search for schemes." wide={false}>
      <Card className="p-6">
        <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
          <Quote className="w-4 h-4" /> You said
        </p>
        <p className="mt-2 text-xl text-navy-900 font-medium leading-relaxed">“{sampleProfile.description}”</p>
      </Card>

      <Card className="p-6 mt-5">
        <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-saffron-500" /> We extracted
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {sampleProfile.fields.map((f) => (
            <span key={f.label} className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-navy-50 border border-navy-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-500">{f.label}</span>
              <span className="font-bold text-navy-900">{f.value}</span>
            </span>
          ))}
        </div>

        <label className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-5 h-5 accent-navy-800" />
          <span className="text-slate-700">
            <span className="font-semibold flex items-center gap-1.5 text-navy-900">
              <ShieldCheck className="w-4 h-4" /> I agree to Sahayak using these details
            </span>
            Only to find matching schemes. Your data is not shared with anyone and you can delete it at any time.
          </span>
        </label>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <Btn to="/" variant="outline"><Pencil className="w-4 h-4" /> Edit</Btn>
          <Btn to="/results" variant="accent"><CheckCircle2 className="w-4 h-4" /> Confirm profile</Btn>
        </div>
      </Card>
    </Page>
  )
}
