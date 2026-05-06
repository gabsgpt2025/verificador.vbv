"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Log the logout activity
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc("log_user_activity", {
          p_user_id: user.id,
          p_activity_type: "logout",
          p_activity_description: "User logged out",
        })
      }

      // Sign out of Supabase session
      await supabase.auth.signOut()

      // TODO: REMOVER - bypass temporário de senha
      // Clear the bypass cookie if active
      await fetch("/api/auth/bypass?action=logout").catch((err) => {
        console.error("Error clearing bypass cookie:", err)
      })

      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={isLoading} className="w-full justify-start">
      <LogOut className="mr-2 h-4 w-4" />
      <span>{isLoading ? "Logging out..." : "Log out"}</span>
    </Button>
  )
}
