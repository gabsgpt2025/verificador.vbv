import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits, getToolCost } from "@/lib/credits/operations"

interface BinVerificationResult {
  bin_number: string
  card_brand: string
  card_type: string
  card_level: string
  issuer_name: string
  issuer_country: string
  issuer_country_code: string
  issuer_website: string
  issuer_phone: string
}

interface BinlistApiResponse {
  scheme?: string
  type?: string
  brand?: string
  prepaid?: boolean
  country?: {
    name?: string
    alpha2?: string
    currency?: string
  }
  bank?: {
    name?: string
    url?: string
    phone?: string
    city?: string
  }
}

/**
 * Fetches BIN data from BinList.net (free public API, no key required).
 * Falls back to deterministic heuristics on network/timeout error.
 */
async function fetchBinFromBinlist(bin: string): Promise<BinlistApiResponse> {
  try {
    // Strictly validate: only digits, length 6–8 (prevent SSRF via path traversal)
    const cleanBin = bin.replace(/\D/g, "").substring(0, 8)
    if (!/^\d{6,8}$/.test(cleanBin)) {
      return buildFallbackBinlistResponse(bin)
    }

    // Safe: cleanBin is now guaranteed to be 6–8 ASCII digits only
    const url = new URL(`https://lookup.binlist.net/${cleanBin}`)
    const response = await fetch(url.toString(), {
      headers: {
        "Accept-Version": "3",
        "User-Agent": "VeriFiBIN/2.0 AntiFraud Platform",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      return data as BinlistApiResponse
    }

    return buildFallbackBinlistResponse(bin)
  } catch {
    return buildFallbackBinlistResponse(bin)
  }
}

/**
 * Deterministic fallback using BIN prefix heuristics.
 * Never uses Math.random() — same BIN always returns the same data.
 */
function buildFallbackBinlistResponse(bin: string): BinlistApiResponse {
  const firstDigit = bin.charAt(0)
  const firstTwo = bin.substring(0, 2)

  let scheme: string | undefined
  if (firstDigit === "4") scheme = "visa"
  else if (["51", "52", "53", "54", "55"].includes(firstTwo)) scheme = "mastercard"
  else if (["34", "37"].includes(firstTwo)) scheme = "amex"
  else if (firstTwo === "60") scheme = "discover"
  else if (firstDigit === "6") scheme = "elo"
  else if (firstTwo === "35") scheme = "jcb"

  return { scheme }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { binNumber, verificationType = "basic" } = body

    if (!binNumber || binNumber.length < 6) {
      return NextResponse.json({ error: "Invalid BIN number" }, { status: 400 })
    }

    // Get tool cost based on verification type
    const toolCost = await getToolCost(`bin_verification_${verificationType}`)

    // Check and subtract credits
    const creditResult = await subtractCredits(
      user.id,
      toolCost,
      `BIN verification for ${binNumber} (${verificationType})`,
      "verification",
    )

    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.message }, { status: 400 })
    }

    // Fetch real BIN data from BinList.net; falls back to deterministic heuristics on error
    const apiData = await fetchBinFromBinlist(binNumber)

    const result: BinVerificationResult = {
      bin_number: binNumber,
      card_brand: apiData.scheme?.toUpperCase() || "UNKNOWN",
      card_type: apiData.type?.toUpperCase() || "UNKNOWN",
      card_level: apiData.brand || (verificationType === "premium" ? "PLATINUM" : "CLASSIC"),
      issuer_name: apiData.bank?.name || "Unknown Issuer",
      issuer_country: apiData.country?.name || "Unknown",
      issuer_country_code: apiData.country?.alpha2 || "",
      issuer_website: apiData.bank?.url || "",
      issuer_phone: apiData.bank?.phone || "",
    }

    // Save verification to database
    const { data: verification, error: insertError } = await supabase
      .from("bin_verifications")
      .insert({
        user_id: user.id,
        bin_number: binNumber,
        card_brand: result.card_brand,
        card_type: result.card_type,
        card_level: result.card_level,
        issuer_name: result.issuer_name,
        issuer_country: result.issuer_country,
        issuer_country_code: result.issuer_country_code,
        issuer_website: result.issuer_website,
        issuer_phone: result.issuer_phone,
        verification_result: result,
        credits_used: toolCost,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error saving verification:", insertError)
      return NextResponse.json({ error: "Failed to save verification" }, { status: 500 })
    }

    // Log user activity
    await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      activity_type: "bin_verification",
      activity_description: `Verified BIN ${binNumber} using ${verificationType} verification`,
      metadata: {
        bin_number: binNumber,
        verification_type: verificationType,
        credits_used: toolCost,
        verification_id: verification.id,
      },
    })

    return NextResponse.json({
      success: true,
      result,
      creditsUsed: toolCost,
      newBalance: creditResult.newBalance,
      verificationId: verification.id,
    })
  } catch (error) {
    console.error("[v0] BIN verification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
