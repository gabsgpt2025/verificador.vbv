import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { addCredits, subtractCredits, resetCredits } from "@/lib/credits/operations"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(cookies())

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin for certain operations
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    const body = await request.json()
    const { operation, amount, description, targetUserId } = body

    // Only admins can perform operations on other users
    const userId = targetUserId && userData?.role === "admin" ? targetUserId : user.id

    let result

    switch (operation) {
      case "add":
        if (userData?.role !== "admin") {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }
        result = await addCredits(userId, amount, description)
        break

      case "subtract":
        result = await subtractCredits(userId, amount, description)
        break

      case "reset":
        if (userData?.role !== "admin") {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }
        result = await resetCredits(userId, amount, description)
        break

      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Credits operations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
