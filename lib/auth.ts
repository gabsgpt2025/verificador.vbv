import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { OPEN_ACCESS_MODE } from "@/lib/open-access-mode"

// Open-access mode: when NEXT_PUBLIC_REQUIRE_AUTH is not set to "true",
// authentication is disabled and all routes are publicly accessible.
// To re-enable auth, set NEXT_PUBLIC_REQUIRE_AUTH=true in your environment.

/** Minimal guest user returned in open-access mode. */
const GUEST_USER: User = {
  id: "00000000-0000-0000-0000-000000000000",
  email: undefined,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "",
}

/** Shape expected from the `users` table (profile). */
interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: string
  credits: number
  is_active: boolean
  [key: string]: unknown
}

const GUEST_PROFILE: UserProfile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: null,
  full_name: "Guest",
  role: "user",
  credits: 0,
  is_active: true,
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  // In open-access mode return the guest user instead of redirecting to login.
  if (OPEN_ACCESS_MODE) {
    return GUEST_USER
  }

  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

export async function getUserProfile(userId: string) {
  // Return a guest profile when userId is the fixed guest UUID.
  if (userId === GUEST_USER.id) {
    return GUEST_PROFILE
  }

  const supabase = await createClient()

  const { data: profile, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return profile
}

export async function requireAdmin() {
  // In open-access mode allow admin access for testing, returning a guest-backed admin profile.
  if (OPEN_ACCESS_MODE) {
    return { user: GUEST_USER, profile: { ...GUEST_PROFILE, role: "admin" } }
  }

  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return { user, profile }
}

/** Whether the application is currently running in open-access mode (auth disabled). */
export { OPEN_ACCESS_MODE }
