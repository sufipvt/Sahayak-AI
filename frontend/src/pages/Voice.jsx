import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, X, Send, RotateCcw, Pencil } from 'lucide-react'
import { sampleProfile } from '../data/sample.js'

const bars = [14, 28, 44, 30, 56, 38, 62, 46, 30, 52, 36, 24, 44, 58, 32, 20, 40, 26, 16]

export default function Voice() {
  const [text, setText] = useState(sampleProfile.description)
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-navy-900/60 backdrop-blur-sm grid place-items-center px-4 py-10">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
        <Link to="/" className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100" aria-label="Close">
          <X className="w-5 h-5 text-slate-500" />
        </Link>

        <p className="text-sm font-semibold text-saffron-700">Voice input · English / हिन्दी</p>
        <div className="relative mx-auto mt-6 w-32 h-32">
          <span className="pulse-ring absolute inset-0 rounded-full bg-saffron-400" />
          <span className="pulse-ring absolute inset-0 rounded-full bg-saffron-300" style={{ animationDelay: '0.9s' }} />
          <button className="relative w-32 h-32 rounded-full bg-saffron-500 grid place-items-center shadow-lg">
            <Mic className="w-14 h-14 text-navy-900" />
          </button>
        </div>
        <p className="mt-6 text-2xl font-bold text-navy-900">Listening…</p>

        <div className="mt-4 h-16 flex items-center justify-center gap-1">
          {bars.map((h, i) => (
            <span
              key={i}
              className="wave-bar w-1.5 rounded-full bg-navy-700"
              style={{ height: h, animationDelay: `${(i % 7) * 0.12}s` }}
            />
          ))}
        </div>

        <div className="mt-6 text-left">
          <label className="text-sm font-semibold text-navy-800 flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Check your question before sending
          </label>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full p-3 rounded-xl border border-slate-300 text-lg outline-none focus:ring-2 focus:ring-saffron-300 resize-none"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={() => setText('')} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 font-semibold text-navy-800 hover:bg-slate-50">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button onClick={() => navigate('/profile')} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-800 text-white font-semibold hover:bg-navy-700">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
