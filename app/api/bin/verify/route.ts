import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { FullBinAnalysis } from "@/lib/premium-3-0/types"
import { OPEN_ACCESS_MODE } from "@/lib/open-access-mode"

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

function mapAnalysisToVerificationResult(binNumber: string, analysis: FullBinAnalysis): BinVerificationResult {
  return {
    bin_number: binNumber,
    card_brand: analysis.technicalData.brand?.toUpperCase() || "UNKNOWN",
    card_type: analysis.technicalData.type?.toUpperCase() || "UNKNOWN",
    card_level: analysis.technicalData.category || "UNKNOWN",
    issuer_name: analysis.technicalData.issuer || "Unknown Issuer",
    issuer_country: analysis.technicalData.countryName || "Unknown",
    issuer_country_code: analysis.technicalData.countryCode || "",
    issuer_website: analysis.technicalData.issuerWebsite || "",
    issuer_phone: analysis.technicalData.issuerPhone || "",
  }
}

function buildStructuredError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if ((authError || !user) && !OPEN_ACCESS_MODE) {
      return buildStructuredError(401, "UNAUTHORIZED", "Não autorizado")
    }

    const body = await request.json()
    const { binNumber, verificationType = "basic" } = body

    if (!binNumber || binNumber.length < 6) {
      return buildStructuredError(400, "INVALID_BIN", "BIN válido (6+ dígitos) é obrigatório")
    }

    console.warn("[DEPRECATED] /api/bin/verify sendo chamado. Migrar para /api/bin-analysis-v2.")

    const upstreamResponse = await fetch(new URL("/api/bin-analysis-v2", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        "x-real-ip": request.headers.get("x-real-ip") || "",
      },
      body: JSON.stringify({ bin: binNumber }),
    })

    if (!upstreamResponse.ok) {
      const upstreamError = await upstreamResponse.json().catch(() => ({ error: "Falha na análise BIN" }))
      return NextResponse.json(upstreamError, { status: upstreamResponse.status === 502 ? 502 : upstreamResponse.status })
    }

    const analysis = (await upstreamResponse.json()) as FullBinAnalysis
    const result = mapAnalysisToVerificationResult(binNumber, analysis)

    let verificationId: string | null = null

    if (user) {
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
          credits_used: 3,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error saving verification:", insertError)
        return buildStructuredError(500, "VERIFICATION_LOG_INSERT_FAILED", "Falha ao salvar a verificação")
      }

      verificationId = verification.id

      await supabase.from("user_activity_logs").insert({
        user_id: user.id,
        activity_type: "bin_verification",
        activity_description: `Verified BIN ${binNumber} using ${verificationType} verification`,
        metadata: {
          bin_number: binNumber,
          verification_type: verificationType,
          credits_used: 3,
          verification_id: verification.id,
        },
      })
    }

    const { data: userRow } = user
      ? await supabase.from("users").select("credits").eq("id", user.id).single()
      : { data: null }

    return NextResponse.json({
      success: true,
      result,
      creditsUsed: 3,
      newBalance: userRow?.credits ?? null,
      verificationId,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[v0] BIN verification upstream error:", error)
      return buildStructuredError(502, "UPSTREAM_BIN_ANALYSIS_FAILURE", "Falha ao consultar a análise BIN real")
    }
    console.error("[v0] BIN verification API error:", error)
    return buildStructuredError(500, "INTERNAL_SERVER_ERROR", "Falha interna ao verificar o BIN")
  }
}
