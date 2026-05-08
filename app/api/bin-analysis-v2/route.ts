import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits } from "@/lib/credits/operations"
import { normalizeBinApiResponse } from "@/lib/premium-3-0/normalizeBinApiResponse"
import { applyBinOverrides } from "@/lib/premium-3-0/applyBinOverrides"
import { runFullBinAnalysis } from "@/lib/premium-3-0"
import { saveBinAnalysisLog } from "@/lib/premium-3-0/saveBinAnalysisLog"
import { callNeutrinoApi, convertNeutrinoResponse } from "@/lib/premium-3-0/neutrino-api"
import type { BinAnalysisV2Request, BinApiData, FullBinAnalysis } from "@/lib/premium-3-0/types"
import { getEnv } from "@/lib/env"

// Open-access mode: when NEXT_PUBLIC_REQUIRE_AUTH !== "true", allow unauthenticated BIN analysis
// TEMPORARY: Testing mode — all auth restrictions disabled
const OPEN_ACCESS_MODE = getEnv().NEXT_PUBLIC_REQUIRE_AUTH !== "true"
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const requestCounters = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const current = requestCounters.get(key)

  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounters.set(key, { count: 1, windowStart: now })
    return false
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  current.count += 1
  requestCounters.set(key, current)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const requesterId =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous"

    if (isRateLimited(requesterId)) {
      return NextResponse.json({ error: "Muitas requisições. Tente novamente em instantes." }, { status: 429 })
    }

    const { bin }: BinAnalysisV2Request = await request.json()

    if (!bin || bin.replace(/\s/g, "").length < 6) {
      return NextResponse.json({ error: "BIN válido (6+ dígitos) é obrigatório" }, { status: 400 })
    }

    const cleanBin = bin.replace(/\s/g, "").substring(0, 8)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // In open-access mode, allow unauthenticated requests (skip auth & credit checks)
    if (!user && !OPEN_ACCESS_MODE) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Deduz créditos somente quando há um usuário autenticado
    if (user) {
      const creditResult = await subtractCredits(user.id, 3, `VeriFiBIN 2.0 — BIN: ${cleanBin}`)
      if (!creditResult.success) {
        return NextResponse.json({ error: creditResult.message }, { status: 400 })
      }
    }

    // Chama API real da Neutrino para análise de BIN
    let binData: BinApiData
    try {
      const neutrinoResponse = await callNeutrinoApi(cleanBin)
      const convertedData = convertNeutrinoResponse(neutrinoResponse)
      binData = normalizeBinApiResponse("NEUTRINO", convertedData, cleanBin)
    } catch (error) {
      console.error("[bin-analysis-v2] Neutrino API error:", error)
      // Fallback para dados simulados em caso de erro
      const rawApiResponse = await simulateBinApiCall(cleanBin)
      binData = normalizeBinApiResponse("INTERNAL", rawApiResponse, cleanBin)
    }

    // Aplica overrides internos antes da análise (requer supabase — skip for guest)
    const binDataWithOverrides = user
      ? (await applyBinOverrides(supabase, binData)).data
      : binData

    // Executa análise completa
    const analysis: FullBinAnalysis = runFullBinAnalysis(binDataWithOverrides)

    // Salva log interno (somente para usuários autenticados)
    if (user) {
      await saveBinAnalysisLog(supabase, user.id, analysis)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[bin-analysis-v2] Error:", error)
    return NextResponse.json({ error: "Falha na análise" }, { status: 500 })
  }
}

// Simulação de chamada de API de BIN — substituir por integração real em produção
async function simulateBinApiCall(bin: string): Promise<Record<string, unknown>> {
  const firstDigit = bin[0]
  const firstTwo = bin.substring(0, 2)
  const binNum = parseInt(bin.substring(0, 6), 10)

  let brand: string
  if (firstDigit === "4") brand = "VISA"
  else if (["51", "52", "53", "54", "55"].includes(firstTwo)) brand = "MASTERCARD"
  else if (["34", "37"].includes(firstTwo)) brand = "AMEX"
  else if (firstTwo === "60") brand = "DISCOVER"
  else brand = "UNKNOWN"

  const types = ["CREDIT", "DEBIT", "PREPAID"]
  const type = types[binNum % types.length]

  const categories = ["CLASSIC", "GOLD", "PLATINUM", "BUSINESS", null]
  const category = categories[binNum % categories.length]

  const countries = ["US", "BR", "GB", "DE", "MX", "AR", "NG", null]
  const countryCode = countries[binNum % countries.length]

  const countryNames: Record<string, string> = {
    US: "United States",
    BR: "Brazil",
    GB: "United Kingdom",
    DE: "Germany",
    MX: "Mexico",
    AR: "Argentina",
    NG: "Nigeria",
  }

  const issuers = ["Chase Bank", "Bradesco", "Barclays", "Deutsche Bank", null]
  const issuer = issuers[binNum % issuers.length]

  return {
    brand,
    type,
    category,
    countryCode,
    countryName: countryCode ? countryNames[countryCode] : undefined,
    currency: countryCode === "US" ? "USD" : countryCode === "BR" ? "BRL" : "USD",
    issuer,
    isPrepaid: type === "PREPAID",
    isCommercial: category === "BUSINESS",
  }
}
