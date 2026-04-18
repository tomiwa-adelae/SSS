import { create } from "zustand"
import { persist } from "zustand/middleware"

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  otherName: string
  username: string
  phoneNumber: string
  image: string | null
  dob: string | null
  createdAt: string | null
  city: string | null
  address: string | null
  state: string | null
  country: string | null
  gender: string | null
  role: string
  userTier?: string | null
  onboardingCompleted?: boolean
  isAdmin?: boolean
  isVendor?: boolean
  adminPosition?: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | null
  adminModules?: string[] | null
} | null

type AuthState = {
  user: User
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string | null) => void
  clearUser: () => void
  _hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clearUser: () => set({ user: null, token: null }),
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: "auth-user",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
