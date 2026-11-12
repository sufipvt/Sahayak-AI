import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ExternalLink, Clock, Info, CheckCircle2, MessageSquare, Loader2, Bookmark, BookmarkCheck } from 'lucide-react'
import { Page, Card, Tag, StatusBadge, UnverifiedNote } from '../components/ui.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import { getScheme, matchSchemes, sendChat, getSavedSchemes, saveScheme, unsaveScheme, errorMessage } from '../api.js'
import { loadProfile, saveProfile, lastMessages } from '../store.js'
import { useAuth } from '../auth.jsx'

// Save / unsave this scheme (logged-in users only).
function SaveButton({ schemeId }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getSavedSchemes().then((list) => setSaved(list.some((s) => s.scheme_id === schemeId))).catch(() => {})
  }, [user, schemeId])

  if (!user) {
    return <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"><Bookmark className="w-4 h-4" /> Log in to save</Link>
  }

  const toggle = async () => {
    try {
      if (saved) await unsaveScheme(schemeId)
      else await saveScheme(schemeId)
      setSaved(!saved)
    } catch (e) {
      alert(errorMessage(e))
    }
  }

  return (
    <button onClick={toggle} aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${saved ? 'bg-navy-800 text-white border-navy-800' : 'border-slate-300 text-navy-800 hover:bg-slate-50'}`}>
      {saved ? <><BookmarkCheck className="w-4 h-4" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save</>}
    </button>
  )
}

// The order in which sections are shown (names come from the official pages).
const SECTION_ORDER = [
  'Description', 'Overview', 'Benefits', 'Eligibility', 'Exclusions', 'Documents Required',
  'Application Process', 'Online Application', 'Offline Application', 'Registration Process',
  'Frequently Asked Questions',
]

function rupees(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// The scheme's rules from schemes.json, in plain words.
function rulesSummary(scheme) {
  const rules = []
  if (scheme.min_age != null || scheme.max_age != null) {
    rules.push(`Age: ${scheme.min_age ?? 'any'} to ${scheme.max_age ?? 'any'} years`)
  }
  if (scheme.max_annual_income != null) rules.push(`Family income up to ${rupees(scheme.max_annual_income)} a year`)
  if (!scheme.states.includes('All')) rules.push(`Only for: ${scheme.states.join(', ')}`)
  if (scheme.gender !== 'any') rules.push(`Only for ${scheme.gender} applicants`)
  if (!scheme.social_categories.includes('any')) rules.push(`Category: ${scheme.social_categories.join(', ')}`)
  if (!scheme.occupations.includes('any')) rules.push(`For: ${scheme.occupations.join(', ')}`)
  if (scheme.needs_disability) rules.push('For persons with disability')
  return rules
}

export default function SchemeDetail() {
  const { id } = useParams()
  const [scheme, setScheme] = useState(null)
  const [check, setCheck] = useState(null)       // this user's eligibility for this scheme
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1. Load the scheme, and check the saved profile against it.
  useEffect(() => {
    setScheme(null)
    setError('')
    setMessages([])
    setConversationId(null)

    getScheme(id).then(setScheme).catch((e) => setError(errorMessage(e)))

    const profile = loadProfile()
    if (Object.values(profile).some((v) => v !== null && v !== undefined)) {
      matchSchemes(profile, true)
        .then((data) => setCheck(data.matches.find((m) => m.scheme_id === id) || null))
        .catch(() => setCheck(null))
    }
  }, [id])

  // 2. Ask a question about this scheme only (scheme_id is sent to the backend).
  async function send(message) {
    const history = lastMessages(messages)
    const withUser = [...messages, { role: 'user', content: message }]
    setMessages(withUser)
    setLoading(true)

    try {
      const data = await sendChat({ message, profile: loadProfile(), history, schemeId: id, conversationId })
      saveProfile(data.profile)
      setConversationId(data.conversation_id)
      setMessages([...withUser, {
        role: 'assistant', content: data.answer, sources: data.sources,
        disclaimer: data.disclaimer, llm_available: data.llm_available,
        message_id: data.message_id,
      }])
    } catch (e) {
      setMessages([...withUser, { role: 'assistant', content: errorMessage(e), error: true }])
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Page>
        <Card className="p-8 text-center text-rose-700">{error}</Card>
      </Page>
    )
  }

  if (!scheme) {
    return (
      <Page>
        <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading scheme…</p>
      </Page>
    )
  }

  const sections = SECTION_ORDER.filter((name) => scheme.sections[name])
  const rules = rulesSummary(scheme)

  return (
    <Page>
      <Link to="/results" className="inline-flex items-center gap-1 text-navy-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      {/* Header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{scheme.category}</Tag>
          {check && <StatusBadge status={check.status} />}
          {scheme.rules_verified === false && <UnverifiedNote />}
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">{scheme.name}</h1>
          <SaveButton schemeId={scheme.scheme_id} />
        </div>
        <p className="mt-1 text-slate-600 flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {scheme.ministry}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          {scheme.url.startsWith('http') && (
            <a href={scheme.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-saffron-700 hover:underline">
              Official page <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {scheme.last_updated && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock className="w-4 h-4" /> Last updated {scheme.last_updated.slice(0, 10)}
            </span>
          )}
        </div>
      </Card>

      <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: the official text, section by section */}
        <div className="space-y-4">
          {sections.length === 0 && (
            <Card className="p-5 text-slate-600">
              This is a PDF guide covering many schemes. Ask a question on the right to search it.
            </Card>
          )}
          {sections.map((name) => (
            <Card key={name} className="p-5">
              <h2 className="font-bold text-lg text-navy-900">{name}</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700 leading-relaxed">{scheme.sections[name]}</p>
            </Card>
          ))}
        </div>

        {/* Right: your eligibility + ask about this scheme */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-bold text-navy-900">Your eligibility</h2>
            {!check ? (
              <p className="mt-1 text-sm text-slate-500">
                Tell Sahayak about yourself on the <Link to="/results" className="text-navy-600 underline">Find schemes</Link> page to check.
              </p>
            ) : (
              <div className="mt-2 text-sm space-y-1">
                {check.why.map((r) => <p key={r} className="flex gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {r}</p>)}
                {check.missing.length > 0 && <p className="text-amber-800">Still needed: {check.missing.join('; ')}</p>}
                {check.failed.length > 0 && <p className="text-rose-700">{check.failed.join(' ')}</p>}
              </div>
            )}

            <h3 className="mt-4 font-semibold text-navy-900 text-sm">Rules we check</h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
              {rules.length ? rules.map((r) => <li key={r}>{r}</li>) : <li>No fixed age, income or occupation rules.</li>}
            </ul>
            {scheme.rule_notes && (
              <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Also: </span>{scheme.rule_notes}</p>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {scheme.disclaimer}
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="font-bold text-navy-900 flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-saffron-600" /> Ask about this scheme
            </h2>
            <ChatPanel
              messages={messages}
              loading={loading}
              onSend={send}
              placeholder="e.g. What documents do I need?"
              emptyText="Answers use only this scheme's official page."
            />
          </Card>
        </div>
      </div>
    </Page>
  )
}
