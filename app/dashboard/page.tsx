"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { IconCamera, IconMapPin, IconVideoOff, IconWifiOff } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"

type Camera = {
  id: number
  name: string
  location_name: string
  is_active: boolean
  stream_url: string
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace("www.", "")
    if (host === "youtube.com" && parsed.pathname.startsWith("/live/"))
      return parsed.pathname.split("/live/")[1]?.split("?")[0] ?? null
    if (host === "youtube.com" && parsed.searchParams.has("v"))
      return parsed.searchParams.get("v")
    if (host === "youtu.be")
      return parsed.pathname.slice(1).split("?")[0]
  } catch {}
  return null
}

function getEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  if (videoId)
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&disablekb=1&iv_load_policy=3`
  return null
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loadingCameras, setLoadingCameras] = useState(true)
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/cameras/`,
          { headers: { Authorization: `Token ${token}` } },
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCameras(data)
      } catch {
        toast.error("Failed to load camera data.")
      } finally {
        setLoadingCameras(false)
      }
    }
    fetchCameras()
  }, [token])

  const totalCameras = cameras.length
  const activeCameras = cameras.filter((c) => c.is_active).length

  const stats = [
    { label: "Total Cameras", value: loadingCameras ? "—" : String(totalCameras) },
    { label: "Active Cameras", value: loadingCameras ? "—" : String(activeCameras) },
    { label: "Detections Today", value: "156" },
    { label: "Active Alerts", value: "7", alert: true },
    { label: "Known Faces", value: "1,243" },
    { label: "Unknown Faces", value: "23" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of surveillance system activity"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(stat.alert && "border-orange-500/40 dark:border-orange-500/30")}
          >
            <CardContent className="p-4">
              {loadingCameras && (stat.label === "Total Cameras" || stat.label === "Active Cameras") ? (
                <>
                  <Skeleton className="mb-2 h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </>
              ) : (
                <>
                  <p className={cn("text-3xl font-bold", stat.alert && "text-orange-500")}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-medium">Live Camera Feeds</h2>
        {loadingCameras ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border bg-muted/30">
            <p className="text-sm text-muted-foreground">No cameras registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cameras.slice(0, 4).map((camera) => {
              const embedUrl = getEmbedUrl(camera.stream_url)
              return (
                <div key={camera.id} className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {embedUrl ? (
                    <>
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onLoad={() =>
                          setLoadedIds((prev) => new Set(prev).add(camera.id))
                        }
                      />
                      {!loadedIds.has(camera.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <IconVideoOff className="size-6 text-white/20" />
                    </div>
                  )}

                  {/* Blocker — prevents YouTube hover UI */}
                  <div className="absolute inset-0" />

                  {/* Gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

                  {/* Top badges */}
                  <div className="pointer-events-none absolute top-1.5 right-1.5 left-1.5 flex items-center justify-between">
                    {camera.is_active ? (
                      <div className="flex items-center gap-1 rounded-sm bg-red-600 px-1 py-0.5">
                        <span className="size-1 animate-pulse rounded-full bg-white" />
                        <span className="text-[10px] font-semibold tracking-wider text-white">LIVE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-sm bg-black/60 px-1 py-0.5">
                        <IconWifiOff className="size-2.5 text-white/70" />
                        <span className="text-[10px] font-semibold text-white/70">OFFLINE</span>
                      </div>
                    )}
                    <span className="rounded-sm bg-black/60 px-1 py-0.5 font-mono text-[10px] text-white/80">
                      CAM-{String(camera.id).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Bottom info */}
                  <div className="pointer-events-none absolute right-1.5 bottom-1.5 left-1.5">
                    <p className="truncate text-xs font-semibold text-white drop-shadow">{camera.name}</p>
                    <div className="flex items-center gap-0.5 text-white/70">
                      <IconMapPin className="size-2.5 shrink-0" />
                      <p className="truncate text-[10px]">{camera.location_name}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-medium">Camera Locations</h2>
        <div className="flex min-h-72 items-center justify-center rounded-lg border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Map integration area — Leaflet / Mapbox
          </p>
        </div>
      </div>
    </div>
  )
}
