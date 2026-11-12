import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Bookmark, Trash2, Loader2 } from 'lucide-react'
import { Page, Card, Tag, LoginRequired } from '../components/ui.jsx'
import { useAuth } from '../auth.jsx'
import { getConversations, deleteConversation, getSavedSchemes, unsaveScheme, errorMessage } from '../api.js'

function shortDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState(null)   // null = loading
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')

  // 1. Load the user's chats and saved schemes.
  useEffect(() => {
    if (!user) return
    getConversations().then(setConversations).catch((e) => setError(errorMessage(e)))
    getSavedSchemes().then(setSaved).catch((e) => setError(errorMessage(e)))
  }, [user])

  if (!user) {
    return <Page title="History & saved schemes"><LoginRequired what="see your chats and saved schemes" /></Page>
  }

  // 2. Open a chat on the Find schemes page.
  const open = (id) => navigate('/results', { state: { conversationId: id } })

  async function removeConversation(id) {
    if (!window.confirm('Delete this chat?')) return
    await deleteConversation(id)
    setConversations(conversations.filter((c) => c.id !== id))
  }

  async function removeSaved(schemeId) {
    await unsaveScheme(schemeId)
    setSaved(saved.filter((s) => s.scheme_id !== schemeId))
  }

  const loading = <p className="py-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>

  return (
    <Page title="History & saved schemes" subtitle="Your past chats and the schemes you saved. Only you can see them.">
      {error && <p className="mb-4 text-rose-700">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-saffron-600" /> Past chats</h2>
          {conversations === null ? loading : conversations.length === 0 ? (
            <p className="py-6 text-center text-slate-500">No chats yet. <Link to="/results" className="text-navy-600 underline">Start one</Link>.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {conversations.map((c) => (
                <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                  <button onClick={() => open(c.id)} className="text-left min-w-0">
                    <span className="block font-semibold text-navy-900 hover:text-navy-600">{c.title}</span>
                    <span className="text-xs text-slate-500">{shortDate(c.updated_at)} · {c.messages / 2} question(s)</span>
                  </button>
                  <button onClick={() => removeConversation(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 shrink-0" aria-label="Delete chat">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg text-navy-900 flex items-center gap-2"><Bookmark className="w-5 h-5 text-saffron-600" /> Saved schemes</h2>
          {saved === null ? loading : saved.length === 0 ? (
            <p className="py-6 text-center text-slate-500">No saved schemes. Use "Save" on a scheme page.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {saved.map((s) => (
                <li key={s.scheme_id} className="py-3 flex items-start justify-between gap-3">
                  <Link to={`/scheme/${s.scheme_id}`} className="min-w-0">
                    <span className="block font-semibold text-navy-900 hover:text-navy-600">{s.name}</span>
                    <span className="mt-1 inline-block"><Tag>{s.category}</Tag></span>
                  </Link>
                  <button onClick={() => removeSaved(s.scheme_id)} className="p-1.5 rounded-lg hover:bg-rose-50 shrink-0" aria-label="Remove saved scheme">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
