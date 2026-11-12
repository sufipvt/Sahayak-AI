import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ListChecks, MessageCircleQuestion } from 'lucide-react'
import { Page, Card, SchemeCard } from '../components/ui.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import ProfileCard from '../components/ProfileCard.jsx'
import { sendChat, matchSchemes, errorMessage } from '../api.js'
import { loadProfile, saveProfile, loadChat, saveChat, clearAll, lastMessages } from '../store.js'

const EXAMPLES = [
  'I am a 20-year-old engineering student from Haryana and my family income is under 3 lakh',
  'I am a 45 year old farmer from Punjab. What help can I get?',
  'How do I apply for Atal Pension Yojana?',
]

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()

  // 1. State: the profile and the chat are also saved in the browser.
  const [profile, setProfile] = useState(loadProfile)
  const [chat, setChat] = useState(loadChat)   // { messages, matches, followUps }
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
      const data = await sendChat({ message, profile, history })

      // The backend returns the updated profile: this is the chat "memory".
      setProfile(data.profile)
      setChat({
        messages: [...messages, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          disclaimer: data.disclaimer,
          llm_available: data.llm_available,
        }],
        matches: data.matches.length > 0 ? data.matches : chat.matches,
        followUps: data.follow_up_questions,
      })
    } catch (error) {
      setChat({ ...chat, messages: [...messages, { role: 'assistant', content: errorMessage(error), error: true }] })
    } finally {
      setLoading(false)
    }
  }

  // 3. A question typed on the Home page arrives here and is sent once.
  const sentFromHome = useRef(false)
  useEffect(() => {
    const question = location.state?.question
    if (question && !sentFromHome.current) {
      sentFromHome.current = true
      navigate(location.pathname, { replace: true, state: null })
      send(question)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    clearAll()
    setProfile({})
    setChat({ messages: [], matches: [], followUps: [] })
  }

  return (
    <Page title="Find schemes for you" subtitle="Describe your situation or ask about a scheme. Answers come only from official scheme pages.">
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: the conversation */}
        <Card className="p-4 sm:p-5">
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
