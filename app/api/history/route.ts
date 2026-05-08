import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ history: [] })
    }

    const { data, error } = await supabase
      .from("bin_analysis_logs")
      .select("id, bin, brand, risk_score, risk_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ history: data ?? [] })
  } catch (error) {
    console.error("[history] Failed to fetch history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
