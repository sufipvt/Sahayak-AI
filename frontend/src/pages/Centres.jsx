import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LocateFixed, Search, MapPin, Info, Loader2, Phone, ExternalLink } from 'lucide-react'
import { Page, Card } from '../components/ui.jsx'
import CentreMap from '../components/CentreMap.jsx'
import { getCentres, errorMessage } from '../api.js'

export default function Centres() {
  const [searchParams] = useSearchParams()
  const [place, setPlace] = useState(searchParams.get('place') || '')
  const [result, setResult] = useState(null)     // { location, centres, csc_locator_url }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search(query) {
    setLoading(true)
    setError('')
    try {
      setResult(await getCentres(query))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // Opened from a chat answer ("Open full map"): search that place at once.
  useEffect(() => {
    const p = searchParams.get('place')
    if (p) search({ place: p })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The browser asks the user for permission first. The position is used
  // for this one search and is not stored.
  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Your browser cannot share its location. Please type a city or PIN code.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => search({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setLoading(false)
        setError('Location permission was not given. Please type a city or PIN code instead.')
      },
      { timeout: 10000 }
    )
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (place.trim()) search({ place: place.trim() })
  }

  return (
    <Page title="Find a service centre" subtitle="Banks, post offices and Common Services Centres (CSCs) near you, where you can apply for schemes.">
      <Card className="p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <button onClick={useMyLocation} disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-navy-800 text-white hover:bg-navy-700 disabled:opacity-60">
          <LocateFixed className="w-4 h-4" /> Use my location
        </button>
        <form onSubmit={onSubmit} className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl pl-3 focus-within:ring-2 focus-within:ring-saffron-300">
          <Search className="w-5 h-5 text-slate-400" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City or 6-digit PIN code"
            className="flex-1 py-2.5 outline-none min-w-0 bg-transparent" aria-label="City or PIN code" />
          <button type="submit" disabled={loading || !place.trim()}
            className="m-1 px-4 py-1.5 rounded-lg bg-saffron-500 font-semibold text-navy-900 hover:bg-saffron-400 disabled:opacity-50">Search</button>
        </form>
      </Card>

      {error && <p className="mb-4 text-rose-700" role="alert">{error}</p>}

      {loading && (
        <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Searching the map…</p>
      )}

      {!loading && !result && !error && (
        <Card className="p-8 text-center bg-slate-50">
          <MapPin className="w-12 h-12 mx-auto text-navy-400" />
          <p className="mt-3 text-slate-600">Use your location or type a city / PIN code to see nearby centres.</p>
        </Card>
      )}

      {!loading && result && (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          <div>
            <CentreMap location={result.location} centres={result.centres} height={460} />
            <p className="mt-2 text-xs text-slate-500">
              Blue: {result.location.label}. Orange: from OpenStreetMap. Green: added by the Sahayak team.
            </p>
          </div>

          <div className="space-y-3">
            <Card className="p-4 bg-saffron-50 border-saffron-200 text-sm text-navy-900">
              <p className="flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Most Common Services Centres are not on the open map yet. Find your nearest CSC on the{' '}
                  <a href={result.csc_locator_url} target="_blank" rel="noreferrer" className="font-semibold underline inline-flex items-center gap-0.5">
                    official CSC locator <ExternalLink className="w-3 h-3" />
                  </a>.
                </span>
              </p>
            </Card>

            {result.centres.length === 0 && <p className="text-slate-600">No centres found nearby on the map.</p>}

            {result.centres.map((c, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900">{c.name}</p>
                    <p className="text-xs font-semibold text-saffron-700">{c.type}</p>
                    <p className="mt-1 text-sm text-slate-600">{c.address}</p>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-navy-700 hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {c.phone}
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-navy-800">{c.distance_km} km</span>
                </div>
              </Card>
            ))}
            <p className="text-xs text-slate-500">Please call before visiting: opening hours and services can change.</p>
          </div>
        </div>
      )}
    </Page>
  )
}
