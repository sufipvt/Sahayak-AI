import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ListChecks, MessageCircleQuestion, Plus } from 'lucide-react'
import { Page, Card, SchemeCard } from '../components/ui.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import ProfileCard from '../components/ProfileCard.jsx'
import { sendChat, matchSchemes, getConversation, errorMessage } from '../api.js'
import { loadProfile, saveProfile, loadChat, saveChat, clearChatAndProfile, lastMessages, EMPTY_CHAT } from '../store.js'
import { useAuth } from '../auth.jsx'

const EXAMPLES = [
  'I am a 20-year-old engineering student from Haryana and my family income is under 3 lakh',
  'I am a 45 year old farmer from Punjab. What help can I get?',
  'How do I apply for Atal Pension Yojana?',
]

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // 1. State: the profile and the chat are also saved in the browser.
  const [profile, setProfile] = useState(loadProfile)
  const [chat, setChat] = useState(loadChat)   // { messages, matches, followUps, conversationId }
  const [loading, setLoading] = useState(false)

  useEffect(() => saveProfile(profile), [profile])
  useEffect(() => saveChat(chat), [chat])

  // 2. Send a message to /api/chat.
  async function send(message) {
    const history = lastMessages(chat.messages)
    const messages = [...chat.messages, { role: 'user', content: message }]
    setChat({ ...chat, messages })
    setLoading(true)

    try {
      const data = await sendChat({ message, profile, history, conversationId: chat.conversationId })

      // The backend returns the updated profile: this is the chat "memory".
      setProfile(data.profile)
      setChat({
        messages: [...messages, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          disclaimer: data.disclaimer,
          llm_available: data.llm_available,
          message_id: data.message_id,     // only for logged-in users (rating)
        }],
        matches: data.matches.length > 0 ? data.matches : chat.matches,
        followUps: data.follow_up_questions,
        conversationId: data.conversation_id,  // the next message continues this chat
      })
    } catch (error) {
      setChat({ ...chat, messages: [...messages, { role: 'assistant', content: errorMessage(error), error: true }] })
    } finally {
      setLoading(false)
    }
  }

  // 3. Arriving from another page:
  //    - Home sends a question  -> send it once
  //    - History opens a chat   -> load its messages from the server
  const handled = useRef(false)
  useEffect(() => {
    const question = location.state?.question
    const conversationId = location.state?.conversationId
    if (handled.current || (!question && !conversationId)) return
    handled.current = true
    navigate(location.pathname, { replace: true, state: null })

    if (question) {
      send(question)
    } else {
      openConversation(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openConversation(conversationId) {
    try {
      const conversation = await getConversation(conversationId)
      const messages = conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        sources: m.sources,
        message_id: m.role === 'assistant' ? m.id : undefined,
        rating: m.rating,
      }))
      const data = await matchSchemes(profile)
      setChat({ messages, matches: data.matches, followUps: data.follow_up_questions, conversationId })
    } catch (error) {
      alert(errorMessage(error))
    }
  }

  // If we already know the profile (e.g. restored after login) but have no
  // matches yet, run the eligibility check once (no AI, instant).
  useEffect(() => {
    const known = Object.values(profile).some((v) => v !== null && v !== undefined)
    if (known && chat.matches.length === 0 && !location.state) {
      matchSchemes(profile)
        .then((data) => setChat((c) => ({ ...c, matches: data.matches, followUps: data.follow_up_questions })))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start a new conversation (the profile is kept).
  function newChat() {
    setChat(EMPTY_CHAT)
  }

  // 4. The user corrected the profile: re-check eligibility (no AI, instant).
  async function onSaveProfile(newProfile) {
    setProfile(newProfile)
    try {
      const data = await matchSchemes(newProfile)
      setChat((c) => ({ ...c, matches: data.matches, followUps: data.follow_up_questions }))
    } catch (error) {
      alert(errorMessage(error))
    }
  }

  function onClear() {
    clearChatAndProfile()
    setProfile({})
    setChat(EMPTY_CHAT)
  }

  return (
    <Page title="Find schemes for you" subtitle="Describe your situation or ask about a scheme. Answers come only from official scheme pages.">
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: the conversation */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">
              {user ? 'Your chats are saved in History.' : 'Guest mode: this chat is not saved. Log in to keep it.'}
            </span>
            {chat.messages.length > 0 && (
              <button onClick={newChat} className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:underline">
                <Plus className="w-4 h-4" /> New chat
              </button>
            )}
          </div>
          <ChatPanel
            messages={chat.messages}
            loading={loading}
            onSend={send}
            placeholder="e.g. I am a 30 year old woman from Bihar and I want to start a small business"
            emptyText="Start by telling Sahayak about yourself, or try an example below."
          />
          {chat.messages.length === 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button key={example} onClick={() => send(example)} disabled={loading}
                  className="text-left text-sm px-3 py-1.5 rounded-full border border-navy-200 bg-navy-50 text-navy-800 hover:bg-navy-100">
                  {example}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: what Sahayak understood + matching schemes */}
        <div className="space-y-4">
          <ProfileCard key={JSON.stringify(profile)} profile={profile} onSave={onSaveProfile} onClear={onClear} />

          {chat.followUps.length > 0 && chat.messages.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50">
              <p className="font-semibold text-amber-900 flex items-center gap-2 text-sm">
                <MessageCircleQuestion className="w-4 h-4" /> To check eligibility better, tell me:
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-amber-900">
                {chat.followUps.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </Card>
          )}

          <div>
            <h2 className="font-bold text-navy-900 flex items-center gap-2 mb-2">
              <ListChecks className="w-5 h-5 text-saffron-600" /> Schemes for you ({chat.matches.length})
            </h2>
            {chat.matches.length === 0 ? (
              <p className="text-sm text-slate-500">Tell Sahayak about yourself to see matching schemes.</p>
            ) : (
              <div className="space-y-3">
                {chat.matches.map((match) => <SchemeCard key={match.scheme_id} match={match} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}
