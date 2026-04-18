"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/store/useAuth"

export function useSignout() {
  const router = useRouter()
  const { token, clearUser } = useAuth()

  return async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      })
    } catch {
      // proceed with local logout even if request fails
    }

    clearUser()
    toast.success("Logged out successfully.")
    router.push("/")
  }
}
