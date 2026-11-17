import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'

// An OpenStreetMap map (Leaflet) with:
//   - a blue dot for the searched place / the user's location
//   - an orange dot for each centre, with a popup (name, address, distance, phone)

const COLOURS = { you: '#1b3264', centre: '#e07b00', admin: '#047857' }

// Zoom the map so every dot is visible.
function FitToDots({ location, centres }) {
  const map = useMap()
  useEffect(() => {
    const points = [[location.lat, location.lon], ...centres.map((c) => [c.lat, c.lon])]
    map.fitBounds(points, { padding: [30, 30], maxZoom: 15 })
  }, [map, location, centres])
  return null
}

export default function CentreMap({ location, centres, height = 380 }) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200 relative z-0">
      <MapContainer center={[location.lat, location.lon]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker center={[location.lat, location.lon]} radius={9}
          pathOptions={{ color: 'white', weight: 2, fillColor: COLOURS.you, fillOpacity: 1 }}>
          <Popup>{location.label}</Popup>
        </CircleMarker>

        {centres.map((c, i) => (
          <CircleMarker key={i} center={[c.lat, c.lon]} radius={7}
            pathOptions={{ color: 'white', weight: 2, fillColor: c.source === 'OpenStreetMap' ? COLOURS.centre : COLOURS.admin, fillOpacity: 1 }}>
            <Popup>
              <strong>{c.name}</strong><br />
              {c.type} · {c.distance_km} km<br />
              {c.address}
              {c.phone && <><br />Phone: {c.phone}</>}
            </Popup>
          </CircleMarker>
        ))}

        <FitToDots location={location} centres={centres} />
      </MapContainer>
    </div>
  )
}
