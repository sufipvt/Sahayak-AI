import { LocateFixed, Search, MapPin, Info } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'

export default function Centres() {
  return (
    <Page title="Find a service centre" subtitle="Find verified Common Services Centres (CSCs) after location search is connected.">
      <Card className="p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <button disabled className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-navy-800 text-white opacity-50 cursor-not-allowed">
          <LocateFixed className="w-4 h-4" /> Use my location
        </button>
        <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl pl-3 focus-within:ring-2 focus-within:ring-saffron-300">
          <Search className="w-5 h-5 text-slate-400" />
          <input disabled placeholder="Enter city / PIN" className="flex-1 py-2.5 outline-none min-w-0 bg-transparent" />
          <button disabled className="m-1 px-4 py-1.5 rounded-lg bg-saffron-500 font-semibold text-navy-900 opacity-50 cursor-not-allowed">Search</button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <Card className="min-h-72 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <MapPin className="w-12 h-12 text-navy-400" />
          <h2 className="mt-4 font-bold text-navy-900">Centre map unavailable</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-600">No location has been accessed and no centre locations are currently available.</p>
        </Card>
        <Card className="min-h-72 flex flex-col items-center justify-center p-8 text-center">
          <Info className="w-8 h-8 text-amber-700" />
          <p className="mt-3 font-semibold text-navy-900">Centre search is not connected yet</p>
          <p className="mt-1 text-sm text-slate-600">Verified addresses, phone numbers, and distances will appear here when a location data source is integrated.</p>
        </Card>
      </div>
    </Page>
  )
}
