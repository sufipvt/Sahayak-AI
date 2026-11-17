import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UploadCloud, Info, Loader2, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'
import { analyseDocument, errorMessage } from '../api.js'
import { loadProfile, saveProfile } from '../store.js'

const LABELS = {
  age: 'Age', gender: 'Gender', state: 'State', annual_income: 'Family income / year',
  social_category: 'Category', occupation: 'Occupation', education: 'Education', disability: 'Disability',
}

function show(field, value) {
  if (field === 'annual_income') return `₹${Number(value).toLocaleString('en-IN')}`
  if (field === 'disability') return value ? 'Yes' : 'No'
  return String(value)
}

export default function Upload() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  // 1. Choose a PDF (click or drag and drop).
  function choose(chosen) {
    setResult(null)
    setAdded(false)
    setError('')
    if (!chosen) return
    if (!chosen.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.')
      return
    }
    setFile(chosen)
  }

  // 2. Send it to the backend to be read and explained.
  async function upload() {
    setLoading(true)
    setError('')
    try {
      setResult(await analyseDocument(file))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // 3. Only after the user confirms: add the details to their profile.
  function addToProfile() {
    saveProfile({ ...loadProfile(), ...result.profile_found })
    setAdded(true)
  }

  const found = result ? Object.entries(result.profile_found) : []

  return (
    <Page title="Upload a document" subtitle="An income certificate, marksheet or scheme notice (PDF). Sahayak explains it in simple words." wide={false}>
      <Card className="p-6">
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files[0]) }}
          className="cursor-pointer border-2 border-dashed border-navy-200 rounded-2xl bg-navy-50/50 p-10 text-center hover:bg-navy-50"
        >
          <UploadCloud className="w-14 h-14 mx-auto text-navy-500" />
          <p className="mt-3 text-lg font-semibold text-navy-900">
            {file ? file.name : 'Click to choose a PDF, or drop it here'}
          </p>
          <p className="mt-1 text-sm text-slate-500">PDF only, up to 10 MB. Scanned images cannot be read yet.</p>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => choose(e.target.files[0])} />
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={upload} disabled={!file || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-saffron-500 font-semibold text-navy-900 hover:bg-saffron-400 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? 'Reading…' : 'Read and explain'}
          </button>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 text-rose-700" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-1" /> {error}
          </p>
        )}
      </Card>

      {result && (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-saffron-700">{result.document_type}</p>
            <p className="mt-1 text-slate-800 leading-relaxed">{result.summary}</p>
            {result.key_points.length > 0 && (
              <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-700">
                {result.key_points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            )}
          </Card>

          {found.length > 0 && (
            <Card className="p-5">
              <h2 className="font-bold text-navy-900">Details found about you</h2>
              <p className="text-sm text-slate-500">Check them. They are added to your profile only if you confirm.</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {found.map(([field, value]) => (
                  <div key={field}>
                    <dt className="text-xs text-slate-500">{LABELS[field]}</dt>
                    <dd className="font-medium text-navy-900">{show(field, value)}</dd>
                  </div>
                ))}
              </dl>
              {added ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Added to your profile.</p>
                  <Btn to="/results" variant="accent">Find schemes for me</Btn>
                </div>
              ) : (
                <button onClick={addToProfile} className="mt-4 px-4 py-2 rounded-lg bg-navy-800 text-white font-semibold">
                  These are correct, add to my profile
                </button>
              )}
            </Card>
          )}
        </div>
      )}

      <p className="mt-4 flex items-start justify-center gap-2 text-sm text-slate-600 text-center">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        The file is read once and not stored. Its text is sent to an external AI service (Groq) to be explained.
        {' '}<Link to="/results" className="underline">Back to chat</Link>
      </p>
    </Page>
  )
}
