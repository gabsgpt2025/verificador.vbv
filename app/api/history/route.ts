import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "10")
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.round(limitParam), 1), 50) : 10

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ history: [] })
    }

    const { data, error } = await supabase
      .from("bin_analysis_logs")
      .select("id, bin, brand, country_code, risk_score, risk_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ history: data ?? [] })
  } catch (error) {
    console.error("[history] Failed to fetch history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
