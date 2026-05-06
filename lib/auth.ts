import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// DEV MODE: Set to true to bypass authentication during development
const DEV_MODE_SKIP_AUTH = true

// Mock user for development mode
const MOCK_USER = {
  id: "dev-user-12345",
  email: "dev@verifibin.com",
  app_metadata: {},
  user_metadata: { full_name: "Dev User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
}

// Mock profile for development mode
const MOCK_PROFILE = {
  id: "dev-user-12345",
  email: "dev@verifibin.com",
  full_name: "Dev User",
  role: "admin", // Change to "user" if you want to test as regular user
  is_active: true,
  credits: 1000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function getUser() {
  // Dev mode: return mock user
  if (DEV_MODE_SKIP_AUTH) {
    return MOCK_USER as any
  }

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
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

export async function getUserProfile(userId: string) {
  // Dev mode: return mock profile
  if (DEV_MODE_SKIP_AUTH) {
    return MOCK_PROFILE as any
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
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return { user, profile }
}
