import { useState } from 'react'
import { LocateFixed, Search, MapPin, Phone, Navigation } from 'lucide-react'
import { Page, Card, Btn } from '../components/ui.jsx'
import { centres } from '../data/sample.js'

function MapIllustration({ active, setActive }) {
  return (
    <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full min-h-72 rounded-2xl overflow-hidden bg-[#e8efe4] border border-slate-200">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <rect x="8" y="8" width="22" height="16" fill="#d4e4cc" />
        <rect x="72" y="74" width="20" height="18" fill="#d4e4cc" />
        <path d="M0 80 Q 30 70 55 85 T 100 78" stroke="#a8cbe6" strokeWidth="5" fill="none" />
        {[20, 45, 70].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#fff" strokeWidth="2.2" />)}
        {[22, 50, 78].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#fff" strokeWidth="2.2" />)}
        <line x1="0" y1="100" x2="100" y2="0" stroke="#fde3b8" strokeWidth="3.5" />
        {[10, 33, 58, 88].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#fff" strokeWidth="0.8" />)}
        {[8, 36, 64, 92].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#fff" strokeWidth="0.8" />)}
      </svg>

      {/* You are here */}
      <div className="absolute" style={{ left: '48%', top: '48%' }}>
        <span className="pulse-ring absolute -inset-3 rounded-full bg-sky-400" />
        <span className="relative block w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow" />
      </div>

      {centres.map((c, i) => (
        <button
          key={c.name}
          onClick={() => setActive(i)}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          aria-label={c.name}
        >
          <span className={`relative grid place-items-center w-9 h-9 rounded-full rounded-br-none rotate-45 shadow-md border-2 border-white ${active === i ? 'bg-saffron-500' : 'bg-navy-800'}`}>
            <span className={`-rotate-45 text-sm font-bold ${active === i ? 'text-navy-900' : 'text-white'}`}>{i + 1}</span>
          </span>
        </button>
      ))}

      <span className="absolute left-3 bottom-3 text-xs bg-white/90 px-2 py-1 rounded-md text-slate-600 shadow-sm">Gurugram · illustration</span>
    </div>
  )
}

export default function Centres() {
  const [active, setActive] = useState(0)

  return (
    <Page title="Find a service centre" subtitle="Visit a Common Services Centre (CSC) near you for help with applications.">
      <Card className="p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <Btn variant="primary" className="sm:w-auto"><LocateFixed className="w-4 h-4" /> Use my location</Btn>
        <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl pl-3 focus-within:ring-2 focus-within:ring-saffron-300">
          <Search className="w-5 h-5 text-slate-400" />
          <input defaultValue="Gurugram, 122001" placeholder="Enter city / PIN" className="flex-1 py-2.5 outline-none min-w-0" />
          <button className="m-1 px-4 py-1.5 rounded-lg bg-saffron-500 font-semibold text-navy-900 hover:bg-saffron-400">Search</button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <MapIllustration active={active} setActive={setActive} />
        <div className="space-y-3">
          <p className="text-sm text-slate-500">5 centres within 6 km</p>
          {centres.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setActive(i)}
              className={`w-full text-left bg-white rounded-2xl border p-4 flex gap-3 transition ${active === i ? 'border-saffron-400 ring-2 ring-saffron-200' : 'border-slate-200 hover:border-navy-200'}`}
            >
              <span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold shrink-0 ${active === i ? 'bg-saffron-500 text-navy-900' : 'bg-navy-800 text-white'}`}>{i + 1}</span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-navy-900">{c.name}</span>
                  <span className="text-sm font-semibold text-saffron-700">{c.distance}</span>
                </span>
                <span className="block text-xs font-semibold text-navy-600 mt-0.5">{c.type}</span>
                <span className="mt-1.5 text-sm text-slate-600 flex gap-1.5"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{c.address}</span>
                <span className="mt-1 text-sm text-slate-600 flex gap-1.5 items-center"><Phone className="w-4 h-4" />{c.phone}</span>
                {active === i && (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                    <Navigation className="w-4 h-4" /> Get directions
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Page>
  )
}
