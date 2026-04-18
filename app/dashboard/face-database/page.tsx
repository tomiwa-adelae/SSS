"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import Image from "next/image"
import { format } from "date-fns"
import { IconUpload, IconUser, IconUserPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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

type Person = {
  id: number
  name: string
  is_wanted: boolean
  created_at: string
  photo: string
}

const addPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  photo: z
    .custom<FileList>()
    .refine(
      (files) => files instanceof FileList && files.length > 0,
      "Photo is required"
    ),
  is_wanted: z.boolean(),
})

type AddPersonValues = z.infer<typeof addPersonSchema>

function getPhotoUrl(photo: string) {
  if (photo.startsWith("http")) return photo
  return `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/media/${photo}`
}

export default function FaceDatabasePage() {
  const { token } = useAuth()
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<AddPersonValues>({
    resolver: zodResolver(addPersonSchema),
    defaultValues: { name: "", is_wanted: false },
  })

  useEffect(() => {
    fetchPersons()
  }, [])

  async function fetchPersons() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/persons/`,
        { headers: { Authorization: `Token ${token}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPersons(data)
    } catch {
      toast.error("Failed to load persons.")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: AddPersonValues) {
    const formData = new FormData()
    formData.append("name", values.name)
    formData.append("photo", values.photo[0])
    formData.append("is_wanted", String(values.is_wanted))

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/persons/add/`,
        {
          method: "POST",
          headers: { Authorization: `Token ${token}` },
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.detail || data?.message || "Failed to add person.")
        return
      }

      toast.success(`${data.name} added to the database.`)
      setPersons((prev) => [
        {
          id: data.id,
          name: data.name,
          is_wanted: data.is_wanted === "True" || data.is_wanted === true,
          created_at: new Date().toISOString(),
          photo: data.photo,
        },
        ...prev,
      ])
      form.reset()
      setPhotoPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setSheetOpen(false)
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Face Database"
          description="Browse and manage persons in the surveillance database"
        />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="mt-1 shrink-0">
              <IconUserPlus className="size-4" />
              Add Person
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader className="border-b">
              <SheetTitle>Add New Person</SheetTitle>
            </SheetHeader>

            <div className="mt-2 px-4">
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
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. John Doe"
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
                    name="photo"
                    render={({ field: { onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:bg-muted/50">
                            {photoPreview ? (
                              <div className="relative h-36 w-36 overflow-hidden rounded-lg">
                                <Image
                                  src={photoPreview}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <>
                                <IconUpload className="mb-2 size-6 text-muted-foreground" />
                                <span className="text-center text-sm text-muted-foreground">
                                  Click to upload a photo
                                </span>
                              </>
                            )}
                            <input
                              {...fieldProps}
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={form.formState.isSubmitting}
                              onChange={(e) => {
                                onChange(e.target.files)
                                const file = e.target.files?.[0]
                                if (file) {
                                  setPhotoPreview(URL.createObjectURL(file))
                                }
                              }}
                            />
                          </label>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_wanted"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel className="text-sm font-medium">
                              Mark as Wanted
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Flag this person as a wanted individual
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    {form.formState.isSubmitting ? "Adding…" : "Add Person"}
                  </Button>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-square w-full rounded-t-lg rounded-b-none" />
              <CardContent className="p-3">
                <Skeleton className="mb-1.5 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : persons.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-muted/30 py-16">
          <IconUser className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No persons in the database yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {persons.map((person) => (
            <Card key={person.id} className="gap-0 overflow-hidden p-0">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={getPhotoUrl(person.photo)}
                  alt={person.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="px-3 py-4">
                <p className="truncate text-sm font-medium">{person.name}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(person.created_at), "MMM d, yyyy")}
                  </span>
                  {person.is_wanted && (
                    <Badge
                      variant="destructive"
                      className="px-1.5 py-0 text-xs"
                    >
                      Wanted
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
