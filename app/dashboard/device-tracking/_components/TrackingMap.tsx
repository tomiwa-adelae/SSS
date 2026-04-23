"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export type ActiveLocation = {
  user_id: number
  username: string
  full_name: string
  role: string
  latitude: number
  longitude: number
  last_updated: string
}

function buildIcon(isCurrentUser: boolean) {
  const color = isCurrentUser ? "#3b82f6" : "#f97316"
  const border = isCurrentUser ? "#1d4ed8" : "#c2410c"
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `
      <div style="
        width:28px;height:28px;
        border-radius:50%;
        background:${color};
        border:3px solid ${border};
        box-shadow:0 2px 6px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>`,
  })
}

function FitBounds({ locations }: { locations: ActiveLocation[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (locations.length === 0 || fitted.current) return
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 14)
    } else {
      const bounds = L.latLngBounds(
        locations.map((l) => [l.latitude, l.longitude]),
      )
      map.fitBounds(bounds, { padding: [48, 48] })
    }
    fitted.current = true
  }, [locations, map])

  return null
}

interface TrackingMapProps {
  locations: ActiveLocation[]
  currentUserId?: number
}

export default function TrackingMap({ locations, currentUserId }: TrackingMapProps) {
  const defaultCenter: [number, number] = [6.5244, 3.3792]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      className="h-full w-full"
      style={{ background: "#1a1a2e" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <FitBounds locations={locations} />

      {locations.map((loc) => (
        <Marker
          key={loc.user_id}
          position={[loc.latitude, loc.longitude]}
          icon={buildIcon(loc.user_id === currentUserId)}
        >
          <Popup>
            <div className="min-w-36 space-y-0.5 text-sm">
              <p className="font-semibold">{loc.full_name || loc.username}</p>
              <p className="text-xs text-gray-500">{loc.role}</p>
              <p className="text-xs text-gray-400">
                {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
