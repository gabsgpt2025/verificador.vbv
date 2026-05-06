import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits } from "@/lib/credits/operations"
import { analyzeBIN } from "@/src/lib/intelligence/binAnalyzer"
import type { RawBINApiResponse } from "@/src/lib/intelligence/types"
import type { BINAnalysisV2Result } from "@/src/lib/intelligence/types"

// Open-access mode: when NEXT_PUBLIC_REQUIRE_AUTH !== "true", allow unauthenticated BIN analysis
const OPEN_ACCESS_MODE = process.env.NEXT_PUBLIC_REQUIRE_AUTH !== "true"

export async function POST(request: NextRequest) {
  try {
    const { bin }: { bin: string } = await request.json()

    if (!bin || bin.length < 6) {
      return NextResponse.json({ error: "BIN válido (6+ dígitos) é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // In open-access mode, allow unauthenticated requests (skip auth & credit checks)
    if (!user && !OPEN_ACCESS_MODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check and deduct credits only when a real user is present
    if (user) {
      const creditResult = await subtractCredits(user.id, 3, "VeriFiBIN 2.0 — Análise Antifraude", `BIN: ${bin}`)
      if (!creditResult.success) {
        return NextResponse.json({ error: creditResult.message }, { status: 400 })
      }
    }

    // Fetch BIN data from external API (BinList.net public API — no key required)
    const rawApiResponse = await fetchBINFromAPI(bin)

    // Run full anti-fraud intelligence analysis
    const result = analyzeBIN({
      bin: bin.trim(),
      rawApiResponse,
      providerName: "BINList",
      analysisType: "advanced",
    })

    // Save to analysis logs (only for authenticated users)
    if (user) {
      await saveAnalysisLog(user.id, result)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[VeriFiBIN] BIN Analysis error:", error)
    return NextResponse.json({ error: "Falha na análise. Tente novamente." }, { status: 500 })
  }
}

/**
 * Fetches BIN data from BinList.net (free, no API key required for basic lookup).
 * In production, replace with a premium provider (Neutrino, FraudLabs Pro, etc.)
 * for higher accuracy and rate limits.
 */
async function fetchBINFromAPI(bin: string): Promise<RawBINApiResponse> {
  try {
    // Strictly validate: only digits, length 6–8 (prevent SSRF via path traversal)
    const cleanBin = bin.replace(/\D/g, "").substring(0, 8)
    if (!/^\d{6,8}$/.test(cleanBin)) {
      return buildFallbackResponse(bin)
    }

    // Safe: cleanBin is now guaranteed to be 6–8 ASCII digits only
    const url = new URL(`https://lookup.binlist.net/${cleanBin}`)
    const response = await fetch(url.toString(), {
      headers: {
        "Accept-Version": "3",
        "User-Agent": "VeriFiBIN/2.0 AntiFraud Platform",
      },
      // 5 second timeout
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      return data as RawBINApiResponse
    }

    // API unavailable — return partial data from BIN prefix heuristics
    return buildFallbackResponse(bin)
  } catch {
    // Network error or timeout — return minimal data
    return buildFallbackResponse(bin)
  }
}

/**
 * Fallback response when the external API is unavailable.
 * Uses BIN prefix heuristics to infer basic card brand.
 * All fields are explicitly null to indicate unavailability.
 */
function buildFallbackResponse(bin: string): RawBINApiResponse {
  const firstDigit = bin.charAt(0)
  const firstTwo = bin.substring(0, 2)

  let scheme: string | undefined
  if (firstDigit === "4") scheme = "visa"
  else if (["51", "52", "53", "54", "55"].includes(firstTwo)) scheme = "mastercard"
  else if (["34", "37"].includes(firstTwo)) scheme = "amex"
  else if (firstTwo === "60") scheme = "discover"
  else if (firstDigit === "6") scheme = "elo"
  else if (firstTwo === "35") scheme = "jcb"

  return {
    bin,
    scheme,
    // All other fields unavailable without real API
    type: undefined,
    prepaid: undefined,
    country: undefined,
    bank: undefined,
  }
}

async function saveAnalysisLog(userId: string, result: BINAnalysisV2Result) {
  try {
    const supabase = await createClient()

    await supabase.from("bin_analysis_logs").insert({
      user_id: userId,
      bin: result.bin,
      bin8: result.bin.length >= 8 ? result.bin.substring(0, 8) : null,
      issuer: result.technicalData.issuer,
      country: result.technicalData.country,
      country_code: result.technicalData.countryCode,
      card_type: result.technicalData.cardType,
      card_category: result.technicalData.cardCategory,
      is_prepaid: result.technicalData.isPrepaid,
      is_commercial: result.technicalData.isCommercial,
      brand: result.technicalData.brand,
      three_ds_status_estimated: result.threeDSAnalysis.status,
      three_ds_confidence: result.threeDSAnalysis.confidence,
      risk_score: result.riskAnalysis.score,
      risk_level: result.riskAnalysis.level,
      recommendation: result.riskAnalysis.recommendation,
      data_quality_score: result.dataQuality.score,
      source_api: result.source.provider,
      model_version: result.metadata.modelVersion,
    })
  } catch (err) {
    // Log save failure is non-critical — don't fail the analysis
    console.error("[VeriFiBIN] Failed to save analysis log:", err)
  }
}

