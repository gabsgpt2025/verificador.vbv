import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isCreditsTestingModeEnabled } from "@/lib/env"

export async function GET(_request: NextRequest) {
  try {
    if (isCreditsTestingModeEnabled()) {
      return NextResponse.json({ credits: 9999 })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user credits
    const { data, error } = await supabase.from("users").select("credits").eq("id", user.id).single()

    if (error) {
      console.error("[v0] Error fetching credits:", error)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    return NextResponse.json({ credits: data.credits })
  } catch (error) {
    console.error("[v0] Credits balance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
