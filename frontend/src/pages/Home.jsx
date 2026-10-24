import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mic, Search, UserRound, ScanSearch, ListChecks, BadgeCheck, GraduationCap, Tractor, HeartHandshake, Store, Upload, MapPin, Languages, Info } from 'lucide-react'

const exampleChips = [
  { label: 'Student', text: 'I am a student looking for education support' },
  { label: 'Farmer', text: 'I am a farmer looking for agriculture support' },
  { label: 'Senior citizen', text: 'I am a senior citizen looking for support' },
  { label: 'Woman entrepreneur', text: 'I want to start a small business' },
]

const howItWorks = [
  { title: 'Describe yourself', text: 'Use a plain-language prompt; voice input will be added later.' },
  { title: 'Review your profile', text: 'Check the details you choose to share before searching.' },
  { title: 'Explore relevant schemes', text: 'When connected, a matching service can compare details with scheme rules.' },
  { title: 'Find reliable guidance', text: 'When connected, review verified benefits, official links and nearby help.' },
]

const chipIcons = { Student: GraduationCap, Farmer: Tractor, 'Senior citizen': HeartHandshake, 'Woman entrepreneur': Store }
const stepIcons = [UserRound, ScanSearch, ListChecks, BadgeCheck]

export default function Home() {
  const [text, setText] = useState('')
  const navigate = useNavigate()

  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 sm:pt-16 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-saffron-200 bg-white/10 px-3 py-1 rounded-full">
            <Languages className="w-4 h-4" /> English · हिन्दी · Multilingual support planned
          </p>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold leading-tight">
            Government scheme information, <span className="text-saffron-400">made easier</span>
          </h1>
          <p className="mt-4 text-lg text-navy-100 max-w-2xl mx-auto">
            Sahayak is designed to help you understand government schemes and where to find official information.
          </p>

          <div className="mt-8 bg-white rounded-2xl p-3 shadow-xl text-left">
            <p className="flex items-center gap-2 px-3 pt-2 text-sm text-amber-800" role="status">
              <Info className="w-4 h-4 shrink-0" />
              Scheme search is not connected yet. No eligibility checks or scheme matches are provided.
            </p>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell us about yourself… e.g. age, state, what you do, family income, category"
              className="w-full resize-none p-3 text-lg text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => navigate('/voice')}
                className="w-12 h-12 rounded-full bg-saffron-100 text-saffron-700 grid place-items-center hover:bg-saffron-200"
                aria-label="Speak"
              >
                <Mic className="w-6 h-6" />
              </button>
              <Link to="/upload" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 px-2">
                <Upload className="w-4 h-4" /> Upload a certificate
              </Link>
              <button
                onClick={() => navigate('/results')}
                className="ml-auto inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-saffron-500 text-navy-900 font-bold text-lg hover:bg-saffron-400"
              >
                <Search className="w-5 h-5" /> Search
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-navy-200 self-center mr-1">Try:</span>
            {exampleChips.map((c) => {
              const Icon = chipIcons[c.label]
              return (
                <button
                  key={c.label}
                  onClick={() => setText(c.text)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-sm font-medium"
                >
                  <Icon className="w-4 h-4 text-saffron-300" /> {c.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900 text-center">How it works</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((s, i) => {
              const Icon = stepIcons[i]
              return (
                <div key={s.title} className="relative text-center px-2">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-navy-50 text-navy-700 grid place-items-center">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="absolute top-0 right-1/2 translate-x-10 -translate-y-1 w-6 h-6 rounded-full bg-saffron-500 text-navy-900 text-xs font-bold grid place-items-center">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-bold text-lg text-navy-900">{s.title}</h3>
                  <p className="mt-1 text-slate-600">{s.text}</p>
                  {i < 3 && <div className="hidden lg:block absolute top-7 -right-3 w-6 border-t-2 border-dashed border-saffron-300" />}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { Icon: Mic, title: 'Speak your question', text: 'Voice capture will be available when speech services are connected.', to: '/voice' },
          { Icon: Upload, title: 'Upload a document', text: 'Certificate reading will be available when document processing is connected.', to: '/upload' },
          { Icon: MapPin, title: 'Find a help centre', text: 'Verified centre search will be available when location data is connected.', to: '/centres' },
        ].map(({ Icon, title, text, to }) => (
          <Link key={title} to={to} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4 hover:shadow-md hover:border-navy-200 transition">
            <span className="w-11 h-11 rounded-xl bg-saffron-50 text-saffron-600 grid place-items-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <span>
              <span className="block font-bold text-navy-900">{title}</span>
              <span className="text-slate-600 text-sm">{text}</span>
            </span>
          </Link>
        ))}
      </section>
    </>
  )
}
