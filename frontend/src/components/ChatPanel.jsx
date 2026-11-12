import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, AlertTriangle } from 'lucide-react'
import Answer from './Answer.jsx'

// A list of messages plus a text box. The page decides what "send" does.
//   messages: [{ role: 'user' | 'assistant', content, sources, error }]

export default function ChatPanel({ messages, loading, onSend, placeholder, emptyText }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  // Scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  const send = () => {
    const message = text.trim()
    if (!message || loading) return
    onSend(message)
    setText('')
  }

  // Enter sends, Shift+Enter makes a new line.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-4">
        {messages.length === 0 && !loading && (
          <p className="py-6 text-center text-slate-500">{emptyText}</p>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy-800 text-white px-4 py-2.5 whitespace-pre-wrap">{m.content}</p>
            </div>
          ) : m.error ? (
            <p key={i} className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {m.content}
            </p>
          ) : (
            <div key={i} className="max-w-full rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
              <Answer message={m} />
            </div>
          )
        )}

        {loading && (
          <p className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Sahayak is checking the official sources…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-saffron-300">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none px-2 py-1.5 outline-none min-w-0"
        />
        <button
          onClick={send}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl bg-saffron-500 text-navy-900 font-semibold hover:bg-saffron-400 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  )
}
