"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import Image from "next/image"
import {
  IconCamera,
  IconMapPin,
  IconPlus,
  IconVideo,
  IconVideoOff,
  IconWifiOff,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PageHeader } from "@/components/PageHeader"
import { useAuth } from "@/store/useAuth"

type Camera = {
  id: number
  name: string
  location_name: string
  latitude: number
  longitude: number
  is_active: boolean
  stream_url: string
}

const registerCameraSchema = z.object({
  name: z.string().min(1, "Camera name is required"),
  location_name: z.string().min(1, "Location is required"),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  stream_url: z.string().url("Enter a valid stream URL"),
})

type RegisterCameraValues = z.infer<typeof registerCameraSchema>

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace("www.", "")

    if (host === "youtube.com" && parsed.pathname.startsWith("/live/")) {
      return parsed.pathname.split("/live/")[1]?.split("?")[0] ?? null
    }
    if (host === "youtube.com" && parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v")
    }
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0]
    }
  } catch {}
  return null
}

function getEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  if (videoId)
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&disablekb=1&iv_load_policy=3`
  return null
}

function getThumbnailUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  return null
}

export default function CamerasPage() {
  const { token } = useAuth()
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [streamCamera, setStreamCamera] = useState<Camera | null>(null)
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set())
  const [dialogLoaded, setDialogLoaded] = useState(false)

  const form = useForm<RegisterCameraValues>({
    resolver: zodResolver(registerCameraSchema),
    defaultValues: {
      name: "",
      location_name: "",
      latitude: "",
      longitude: "",
      stream_url: "",
    },
  })

  useEffect(() => {
    fetchCameras()
  }, [])

  async function fetchCameras() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/cameras/`,
        { headers: { Authorization: `Token ${token}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCameras(data)
    } catch {
      toast.error("Failed to load cameras.")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: RegisterCameraValues) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/cameras/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(values),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(
          data?.detail || data?.message || "Failed to register camera."
        )
        return
      }

      toast.success(`${data.name} registered successfully.`)
      setCameras((prev) => [
        {
          id: data.id,
          name: data.name,
          location_name: data.location_name,
          latitude: parseFloat(values.latitude),
          longitude: parseFloat(values.longitude),
          is_active: true,
          stream_url: values.stream_url,
        },
        ...prev,
      ])
      form.reset()
      setSheetOpen(false)
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  const activeCount = cameras.filter((c) => c.is_active).length
  const embedUrl = streamCamera ? getEmbedUrl(streamCamera.stream_url) : null

  function openStream(camera: Camera) {
    setDialogLoaded(false)
    setStreamCamera(camera)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Cameras"
          description={
            loading
              ? "Loading cameras…"
              : `${cameras.length} total · ${activeCount} active`
          }
        />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="mt-1 shrink-0">
              <IconPlus className="size-4" />
              Register Camera
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader className="border-b">
              <SheetTitle>Register New Camera</SheetTitle>
            </SheetHeader>

            <div className="mt-2 px-3">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camera Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Camera T"
                            disabled={form.formState.isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. West Wing"
                            disabled={form.formState.isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 3.0344"
                              disabled={form.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 7.9023"
                              disabled={form.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="stream_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://…"
                            disabled={form.formState.isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    {form.formState.isSubmitting
                      ? "Registering…"
                      : "Register Camera"}
                  </Button>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="mt-2 h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-muted/30">
          <IconCamera className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No cameras registered yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {cameras.map((camera) => {
            const cardEmbedUrl = getEmbedUrl(camera.stream_url)
            return (
              <Card key={camera.id} className="gap-2 overflow-hidden p-0">
                {/* Live feed */}
                <div className="relative aspect-video bg-black">
                  {cardEmbedUrl ? (
                    <>
                      <iframe
                        src={cardEmbedUrl}
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
                          <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <IconVideoOff className="size-8 text-white/20" />
                    </div>
                  )}

                  {/* Transparent blocker — prevents YouTube hover UI from showing */}
                  <div className="absolute inset-0" />

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />

                  {/* Top row — LIVE badge + CAM ID */}
                  <div className="pointer-events-none absolute top-2 right-2 left-2 flex items-center justify-between">
                    {camera.is_active ? (
                      <div className="flex items-center gap-1.5 rounded-sm bg-red-600 px-1.5 py-0.5">
                        <span className="size-1.5 animate-pulse rounded-full bg-white" />
                        <span className="text-xs font-semibold tracking-wider text-white">
                          LIVE
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-sm bg-black/60 px-1.5 py-0.5">
                        <IconWifiOff className="size-3 text-white/70" />
                        <span className="text-xs font-semibold text-white/70">
                          OFFLINE
                        </span>
                      </div>
                    )}
                    <span className="rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white/80">
                      CAM-{String(camera.id).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Bottom row — name + location */}
                  <div className="pointer-events-none absolute right-2 bottom-2 left-2">
                    <p className="truncate text-sm font-semibold text-white drop-shadow">
                      {camera.name}
                    </p>
                    <div className="flex items-center gap-1 text-white/70">
                      <IconMapPin className="size-3 shrink-0" />
                      <p className="truncate text-xs">{camera.location_name}</p>
                    </div>
                  </div>
                </div>

                {/* Watch button */}
                <CardContent className="px-2 pb-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={!camera.stream_url || !camera.is_active}
                    onClick={() => openStream(camera)}
                  >
                    <IconVideo className="size-3.5" />
                    Watch Stream
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Stream Dialog */}
      <Dialog
        open={!!streamCamera}
        onOpenChange={(open) => !open && setStreamCamera(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-sm bg-red-600 px-1.5 py-0.5">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-semibold tracking-wider text-white">
                  LIVE
                </span>
              </span>
              {streamCamera?.name}
              <span className="font-normal text-muted-foreground">
                — {streamCamera?.location_name}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Live stream for {streamCamera?.name} at{" "}
              {streamCamera?.location_name}
            </DialogDescription>
          </DialogHeader>

          <div
            className="relative w-full bg-black"
            style={{ aspectRatio: "16/9" }}
          >
            {embedUrl ? (
              <>
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setDialogLoaded(true)}
                />
                <div className="absolute inset-0" />
                {!dialogLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <IconVideoOff className="size-10 opacity-50" />
                <p className="text-sm opacity-70">
                  Stream could not be loaded.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
