import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { subtractCredits } from "@/lib/credits/operations"
import { normalizeBinApiResponse } from "@/lib/bin/normalizeBinApiResponse"
import { applyBinOverrides } from "@/lib/bin/applyBinOverrides"
import { runFullBinAnalysis } from "@/lib/bin"
import { saveBinAnalysisLog } from "@/lib/bin/saveBinAnalysisLog"
import type { BinAnalysisV2Request, FullBinAnalysis } from "@/lib/bin/types"

export async function POST(request: NextRequest) {
  try {
    const { bin }: BinAnalysisV2Request = await request.json()

    if (!bin || bin.replace(/\s/g, "").length < 6) {
      return NextResponse.json({ error: "BIN válido (6+ dígitos) é obrigatório" }, { status: 400 })
    }

    const cleanBin = bin.replace(/\s/g, "").substring(0, 8)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Deduz créditos (análise avançada custa 3 créditos)
    const creditResult = await subtractCredits(user.id, 3, `VeriFiBIN 2.0 — BIN: ${cleanBin}`)
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.message }, { status: 400 })
    }

    // Em produção: chamar API real de BIN (Neutrino, Binlist, etc.)
    // Por ora, usa normalização interna com dados simulados (substituir por chamada real)
    const rawApiResponse = await simulateBinApiCall(cleanBin)
    const binData = normalizeBinApiResponse("INTERNAL", rawApiResponse, cleanBin)

    // Aplica overrides internos antes da análise
    const { data: binDataWithOverrides } = await applyBinOverrides(supabase as never, binData)

    // Executa análise completa
    const analysis: FullBinAnalysis = runFullBinAnalysis(binDataWithOverrides)

    // Salva log interno
    await saveBinAnalysisLog(supabase as never, user.id, analysis)

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
