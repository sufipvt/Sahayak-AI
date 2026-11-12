import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ExternalLink, Info, AlertTriangle, Volume2, Square, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Citation } from './ui.jsx'
import { canSpeak, speak, stopSpeaking } from '../voice.js'
import { rateAnswer } from '../api.js'

// Helpful / not helpful buttons. Only for saved answers (logged-in users),
// because the rating is stored with the answer in the database.
function RateButtons({ messageId, initial }) {
  const [rating, setRating] = useState(initial ?? null)

  // When a saved chat is loaded from the server, show its stored rating.
  useEffect(() => setRating(initial ?? null), [initial])

  const rate = async (value) => {
    try {
      await rateAnswer(messageId, value)
      setRating(value)
    } catch {
      // ignore: rating is optional
    }
  }

  const style = (value) =>
    `p-1 rounded-md ${rating === value ? 'bg-navy-100 text-navy-800' : 'text-slate-400 hover:text-navy-700'}`

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs text-slate-500">Helpful?</span>
      <button onClick={() => rate(1)} className={style(1)} aria-label="Helpful" aria-pressed={rating === 1}><ThumbsUp className="w-4 h-4" /></button>
      <button onClick={() => rate(-1)} className={style(-1)} aria-label="Not helpful" aria-pressed={rating === -1}><ThumbsDown className="w-4 h-4" /></button>
    </span>
  )
}

// Reads the answer aloud with the browser's voice (hidden if not supported).
function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false)

  // Stop talking if the answer disappears (e.g. the user leaves the page).
  useEffect(() => () => { if (speaking) stopSpeaking() }, [speaking])

  if (!canSpeak) return null

  const toggle = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speak(text, () => setSpeaking(false))
    }
  }

  return (
    <button onClick={toggle} className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-800"
      aria-label={speaking ? 'Stop reading' : 'Read answer aloud'}>
      {speaking ? <><Square className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-4 h-4" /> Listen</>}
    </button>
  )
}

// Shows one answer from Sahayak:
//   1. the answer text (markdown), with [Source n] turned into small badges
//   2. the list of sources with links to the official pages
//   3. the disclaimer

export default function Answer({ message }) {
  const { content, sources = [], disclaimer, llm_available } = message

  // "[Source 2]" (or "【Source 2】") -> a markdown link "#source-2",
  // which is drawn as a small citation badge below.
  const text = content.replace(/[[【]\s*Source\s*(\d+)\s*[\]】]/g, '[$1](#source-$1)')

  const sourceTitle = (n) => {
    const source = sources.find((s) => s.number === n)
    return source ? `${source.scheme_name} – ${source.section}` : `Source ${n}`
  }

  return (
    <div>
      {llm_available === false && (
        <p className="mb-2 flex items-center gap-1.5 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4" /> The AI service is unavailable, showing official passages only.
        </p>
      )}

      <div className="answer text-[15px] leading-relaxed">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('#source-')) {
                const n = Number(href.replace('#source-', ''))
                return <Citation n={n} title={sourceTitle(n)} />
              }
              return <a href={href} target="_blank" rel="noreferrer" className="text-navy-600 underline">{children}</a>
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>

      {sources.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">Sources</p>
          <ul className="space-y-1">
            {sources.map((s) => (
              <li key={s.number} className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                <Citation n={s.number} />
                <span className="font-medium text-navy-800">{s.scheme_name}</span>
                <span>· {s.section}</span>
                {s.url?.startsWith('http') && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-navy-600 hover:underline">
                    official page <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {s.last_updated && <span className="text-slate-400">· updated {s.last_updated.slice(0, 10)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        {disclaimer && (
          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {disclaimer}
          </p>
        )}
        <span className="inline-flex items-center gap-3">
          {message.message_id && <RateButtons messageId={message.message_id} initial={message.rating} />}
          <SpeakButton text={content} />
        </span>
      </div>
    </div>
  )
}
