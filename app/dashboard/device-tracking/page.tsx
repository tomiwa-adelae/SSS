"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  IconMapPin,
  IconRadar,
  IconRefresh,
  IconUser,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"
import { cn } from "@/lib/utils"
import type { ActiveLocation } from "./_components/TrackingMap"

const TrackingMap = dynamic(
  () => import("./_components/TrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    ),
  },
)

const LOCATION_INTERVAL = 2000
const POLL_INTERVAL = 2000

export default function DeviceTrackingPage() {
  const { token, user } = useAuth()

  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [locations, setLocations] = useState<ActiveLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/tracking/active-locations/`,
        { headers: { Authorization: `Token ${token}` } },
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocations(data)
    } catch {
      // silent — we don't toast on every poll failure
    } finally {
      setLoadingLocations(false)
    }
  }, [token])

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/tracking/update-location/`,
            {
              method: "POST",
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            },
          )
        } catch {
          // silent — keep trying on next interval
        }
      },
      () => {
        toast.error("Unable to get your location. Check browser permissions.")
        stopTracking()
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [token])

  function startTracking() {
    sendLocation()
    locationIntervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL)
  }

  function stopTracking() {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
      locationIntervalRef.current = null
    }
  }

  async function handleToggle() {
    if (toggling) return
    setToggling(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/tracking/toggle/`,
        {
          method: "PATCH",
          headers: { Authorization: `Token ${token}` },
        },
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const enabled: boolean = data.tracking_enabled
      setTrackingEnabled(enabled)
      if (enabled) {
        toast.success("Tracking enabled. Your location is now being shared.")
        startTracking()
      } else {
        toast.info("Tracking disabled.")
        stopTracking()
      }
    } catch {
      toast.error("Failed to toggle tracking.")
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    fetchLocations()
    pollIntervalRef.current = setInterval(fetchLocations, POLL_INTERVAL)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      stopTracking()
    }
  }, [fetchLocations])

  const activeCount = locations.length

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Device Tracking"
          description="Real-time location tracking of active personnel"
        />

        <div className="mt-1 flex shrink-0 items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLocations}
            disabled={loadingLocations}
          >
            <IconRefresh
              className={cn("size-4", loadingLocations && "animate-spin")}
            />
            Refresh
          </Button>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            {trackingEnabled ? (
              <IconWifi className="size-4 text-green-500" />
            ) : (
              <IconWifiOff className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {trackingEnabled ? "Sharing location" : "Not sharing"}
            </span>
            <Switch
              checked={trackingEnabled}
              onCheckedChange={handleToggle}
              disabled={toggling}
              className="ml-1"
            />
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Map */}
        <div className="relative min-h-105 overflow-hidden rounded-xl border bg-muted/30">
          {loadingLocations && locations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            </div>
          ) : (
            <TrackingMap
              locations={locations}
              currentUserId={user?.id ? Number(user.id) : undefined}
            />
          )}

          {/* Live badge */}
          <div className="pointer-events-none absolute top-3 left-3 z-1000 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-semibold text-white">LIVE</span>
          </div>

          {/* Active count badge */}
          <div className="pointer-events-none absolute top-3 right-3 z-1000">
            <Badge className="bg-black/70 text-white backdrop-blur-sm hover:bg-black/70">
              <IconRadar className="mr-1 size-3" />
              {activeCount} active
            </Badge>
          </div>
        </div>

        {/* Personnel sidebar */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Active Personnel ({activeCount})
          </h2>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {loadingLocations && locations.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : locations.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border bg-muted/30 py-8">
                <IconMapPin className="mb-2 size-6 text-muted-foreground" />
                <p className="text-center text-xs text-muted-foreground">
                  No active personnel
                </p>
              </div>
            ) : (
              locations.map((loc) => {
                const isSelf = user?.id ? loc.user_id === Number(user.id) : false
                return (
                  <Card
                    key={loc.user_id}
                    className={cn(isSelf && "border-blue-500/40 bg-blue-500/5")}
                  >
                    <CardContent className="flex items-start gap-3 p-3">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          isSelf ? "bg-blue-500" : "bg-orange-500",
                        )}
                      >
                        <IconUser className="size-4 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {loc.full_name || loc.username}
                          </p>
                          {isSelf && (
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{loc.role}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(loc.last_updated), "h:mm:ss a")}
                        </p>
                      </div>

                      <span className="mt-0.5 size-2 shrink-0 rounded-full bg-green-400" />
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
