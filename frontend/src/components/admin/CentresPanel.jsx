import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { Card } from '../ui.jsx'
import { getAdminCentres, addAdminCentre, deleteAdminCentre, errorMessage } from '../../api.js'

const emptyForm = { name: '', centre_type: 'Common Services Centre', address: '', phone: '', latitude: '', longitude: '' }

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200'

// Common Services Centres added by hand (OpenStreetMap has almost none).
// They appear on the Centres map next to banks and post offices.
export default function CentresPanel() {
  const [centres, setCentres] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  // 1. Load the list.
  const load = () => getAdminCentres().then(setCentres).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load() }, [])

  // 2. Add a centre (the server checks the coordinates are in India).
  async function add(event) {
    event.preventDefault()
    setError('')
    try {
      await addAdminCentre({
        ...form,
        address: form.address || null,
        phone: form.phone || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      })
      setForm(emptyForm)
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  // 3. Delete a centre.
  async function remove(centre) {
    if (!window.confirm(`Delete "${centre.name}"?`)) return
    try {
      await deleteAdminCentre(centre.id)
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-saffron-600" /> Service centres
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        CSCs added here appear on the Centres map. Take the details from the official CSC locator.
      </p>

      <ul className="mt-4 divide-y divide-slate-100">
        {centres.length === 0 && <li className="py-2 text-sm text-slate-500">No centres added yet.</li>}
        {centres.map((c) => (
          <li key={c.id} className="py-2 flex items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-navy-900">{c.name}</p>
              <p className="text-slate-500">
                {c.centre_type}{c.address && ` · ${c.address}`}{c.phone && ` · ${c.phone}`}
              </p>
              <p className="text-xs text-slate-400">{c.latitude}, {c.longitude}</p>
            </div>
            <button onClick={() => remove(c)} className="p-2 rounded-lg text-rose-700 hover:bg-rose-50" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-4 grid sm:grid-cols-2 gap-3">
        <input required placeholder="Name *" className={inputCls} {...field('name')} />
        <input placeholder="Type" className={inputCls} {...field('centre_type')} />
        <input placeholder="Address" className={inputCls} {...field('address')} />
        <input placeholder="Phone" className={inputCls} {...field('phone')} />
        <input required type="number" step="any" placeholder="Latitude * (e.g. 28.46)" className={inputCls} {...field('latitude')} />
        <input required type="number" step="any" placeholder="Longitude * (e.g. 77.03)" className={inputCls} {...field('longitude')} />
        <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-navy-800 text-white hover:bg-navy-700">
          <Plus className="w-4 h-4" /> Add centre
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
    </Card>
  )
}
