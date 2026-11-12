import { useState } from 'react'
import { UserRound, Pencil, Trash2 } from 'lucide-react'
import { Card } from './ui.jsx'

// The options must match profile_extractor.py on the backend.
const OCCUPATIONS = ['farmer', 'student', 'entrepreneur', 'self-employed', 'unorganised worker',
  'street vendor', 'salaried', 'unemployed', 'homemaker', 'retired']
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS']
const GENDERS = ['male', 'female', 'other']

const LABELS = {
  age: 'Age',
  gender: 'Gender',
  state: 'State',
  annual_income: 'Family income / year',
  social_category: 'Category',
  occupation: 'Occupation',
  education: 'Education',
  disability: 'Disability',
}

function showValue(field, value) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">Not given</span>
  if (field === 'annual_income') return `₹${Number(value).toLocaleString('en-IN')}`
  if (field === 'disability') return value ? 'Yes' : 'No'
  return String(value)
}

// Shows the profile Sahayak understood. The user can correct any field;
// saving re-runs the eligibility check (no AI call).
export default function ProfileCard({ profile, onSave, onClear }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)

  const startEditing = () => {
    setForm(profile)
    setEditing(true)
  }

  const set = (field, value) => setForm({ ...form, [field]: value === '' ? null : value })

  const save = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      age: form.age == null ? null : Number(form.age),
      annual_income: form.annual_income == null ? null : Number(form.annual_income),
    })
    setEditing(false)
  }

  const input = 'w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white'

  const select = (field, options) => (
    <select value={form[field] ?? ''} onChange={(e) => set(field, e.target.value)} className={input}>
      <option value="">Not given</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-navy-900 flex items-center gap-2">
          <UserRound className="w-5 h-5 text-saffron-600" /> Your profile
        </h2>
        {!editing && (
          <div className="flex gap-1">
            <button onClick={startEditing} className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit profile">
              <Pencil className="w-4 h-4 text-navy-700" />
            </button>
            <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-slate-100" title="Clear profile and chat">
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">Understood from your messages. Correct anything that is wrong.</p>

      {!editing ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {Object.keys(LABELS).map((field) => (
            <div key={field}>
              <dt className="text-xs text-slate-500">{LABELS[field]}</dt>
              <dd className="font-medium text-navy-900">{showValue(field, profile[field])}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <form onSubmit={save} className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <label>Age<input type="number" min="0" max="120" value={form.age ?? ''} onChange={(e) => set('age', e.target.value)} className={input} /></label>
          <label>Gender{select('gender', GENDERS)}</label>
          <label>State<input value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} className={input} placeholder="e.g. Haryana" /></label>
          <label>Income / year (₹)<input type="number" min="0" value={form.annual_income ?? ''} onChange={(e) => set('annual_income', e.target.value)} className={input} /></label>
          <label>Category{select('social_category', CATEGORIES)}</label>
          <label>Occupation{select('occupation', OCCUPATIONS)}</label>
          <label>Education<input value={form.education ?? ''} onChange={(e) => set('education', e.target.value)} className={input} /></label>
          <label>Disability
            <select value={form.disability == null ? '' : String(form.disability)} onChange={(e) => set('disability', e.target.value === '' ? null : e.target.value === 'true')} className={input}>
              <option value="">Not given</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <div className="col-span-2 flex gap-2 mt-1">
            <button type="submit" className="px-4 py-2 rounded-lg bg-navy-800 text-white font-semibold">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-slate-300">Cancel</button>
          </div>
        </form>
      )}
    </Card>
  )
}
