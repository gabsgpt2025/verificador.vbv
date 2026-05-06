import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// TODO: REMOVER - bypass temporário de senha
const BYPASS_COOKIE = "bypass_auth_role"

// TODO: REMOVER - bypass temporário de senha
async function getBypassRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const role = cookieStore.get(BYPASS_COOKIE)?.value
    if (role === "admin" || role === "user") return role
    return null
  } catch {
    return null
  }
}

export async function getUser() {
  // TODO: REMOVER - bypass temporário de senha
  const bypassRole = await getBypassRole()
  if (bypassRole) {
    return {
      id: `bypass-${bypassRole}`,
      email: bypassRole === "admin" ? "admin@bypass.test" : "user@bypass.test",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    }
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
  // TODO: REMOVER - bypass temporário de senha
  const bypassRole = await getBypassRole()
  if (bypassRole) {
    return {
      id: userId,
      email: bypassRole === "admin" ? "admin@bypass.test" : "user@bypass.test",
      full_name: bypassRole === "admin" ? "Admin (Bypass Temporário)" : "Usuário (Bypass Temporário)",
      role: bypassRole,
      credits: bypassRole === "admin" ? 1000 : 500,
      is_active: true,
      created_at: new Date().toISOString(),
    }
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
