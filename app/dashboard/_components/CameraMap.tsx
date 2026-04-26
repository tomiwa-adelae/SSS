"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export type CameraMapItem = {
  id: number
  name: string
  location_name: string
  latitude: number
  longitude: number
  is_active: boolean
}

function buildIcon(isActive: boolean) {
  const color = isActive ? "#22c55e" : "#6b7280"
  const border = isActive ? "#16a34a" : "#4b5563"
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
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      </div>`,
  })
}

function FitBounds({ cameras }: { cameras: CameraMapItem[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (cameras.length === 0 || fitted.current) return
    if (cameras.length === 1) {
      map.setView([cameras[0].latitude, cameras[0].longitude], 14)
    } else {
      const bounds = L.latLngBounds(cameras.map((c) => [c.latitude, c.longitude]))
      map.fitBounds(bounds, { padding: [48, 48] })
    }
    fitted.current = true
  }, [cameras, map])

  return null
}

interface CameraMapProps {
  cameras: CameraMapItem[]
}

export default function CameraMap({ cameras }: CameraMapProps) {
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

      <FitBounds cameras={cameras} />

      {cameras.map((cam) => (
        <Marker
          key={cam.id}
          position={[cam.latitude, cam.longitude]}
          icon={buildIcon(cam.is_active)}
        >
          <Popup>
            <div className="min-w-36 space-y-0.5 text-sm">
              <p className="font-semibold">{cam.name}</p>
              <p className="text-xs text-gray-500">{cam.location_name}</p>
              <p className={`text-xs font-medium ${cam.is_active ? "text-green-600" : "text-gray-400"}`}>
                {cam.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
