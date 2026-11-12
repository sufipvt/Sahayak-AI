import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, UserRound, ScanSearch, ListChecks, BadgeCheck, GraduationCap, Tractor, HeartHandshake, Store, Upload, MapPin, ShieldCheck } from 'lucide-react'

const exampleChips = [
  { label: 'Student', text: 'I am a 20-year-old engineering student from Haryana and my family income is under 3 lakh' },
  { label: 'Farmer', text: 'I am a 45 year old farmer from Punjab. What help can I get?' },
  { label: 'Senior citizen', text: 'I am 62 years old and live in Uttar Pradesh. Is there any pension for me?' },
  { label: 'Woman entrepreneur', text: 'I am a 30 year old woman from Bihar and I want to start a small business' },
]

const howItWorks = [
  { title: 'Describe yourself', text: 'Write in plain words: age, state, what you do, family income.' },
  { title: 'Check your profile', text: 'Sahayak shows what it understood. Correct anything that is wrong.' },
  { title: 'See matching schemes', text: 'Your details are checked against each scheme\'s rules, with the reason.' },
  { title: 'Get cited answers', text: 'Benefits, documents and steps, each linked to the official page.' },
]

const chipIcons = { Student: GraduationCap, Farmer: Tractor, 'Senior citizen': HeartHandshake, 'Woman entrepreneur': Store }
const stepIcons = [UserRound, ScanSearch, ListChecks, BadgeCheck]

export default function Home() {
  const [text, setText] = useState('')
  const navigate = useNavigate()

  // Open the Results page; it sends this text to the backend.
  const search = () => {
    const question = text.trim()
    navigate('/results', { state: question ? { question } : null })
  }

  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 sm:pt-16 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-saffron-200 bg-white/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4" /> Answers from official government pages, with sources
          </p>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold leading-tight">
            Government scheme information, <span className="text-saffron-400">made easier</span>
          </h1>
          <p className="mt-4 text-lg text-navy-100 max-w-2xl mx-auto">
            Sahayak is designed to help you understand government schemes and where to find official information.
          </p>

          <div className="mt-8 bg-white rounded-2xl p-3 shadow-xl text-left">
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); search() } }}
              placeholder="Tell us about yourself… e.g. age, state, what you do, family income, category"
              className="w-full resize-none p-3 text-lg text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Link to="/upload" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 px-2">
                <Upload className="w-4 h-4" /> Upload a certificate
              </Link>
              <button
                onClick={search}
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

      <section className="max-w-7xl mx-auto px-4 mt-10 grid sm:grid-cols-2 gap-4">
        {[
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
