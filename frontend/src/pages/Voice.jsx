import { Link } from 'react-router-dom'
import { Mic, X, Info } from 'lucide-react'

export default function Voice() {
  return (
    <div className="min-h-[calc(100vh-10rem)] bg-navy-900/60 backdrop-blur-sm grid place-items-center px-4 py-10">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
        <Link to="/" className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100" aria-label="Close">
          <X className="w-5 h-5 text-slate-500" />
        </Link>

        <p className="text-sm font-semibold text-saffron-700">Voice input · English / हिन्दी</p>
        <div className="relative mx-auto mt-6 w-32 h-32">
          <div className="relative w-32 h-32 rounded-full bg-saffron-100 grid place-items-center">
            <Mic className="w-14 h-14 text-navy-900" />
          </div>
        </div>
        <p className="mt-6 text-2xl font-bold text-navy-900">Voice input unavailable</p>
        <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold"><Info className="w-4 h-4 shrink-0" /> Voice capture and transcription are not connected yet.</p>
          <p className="mt-1">No audio is being recorded. Return home to review example prompts; search is also not connected.</p>
        </div>
      </div>
    </div>
  )
}
