// lib/premium-3-0/saveBinAnalysisLog.ts
// Salva log de análise de BIN no banco de dados

import type { FullBinAnalysis } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export async function saveBinAnalysisLog(
  supabase: SupabaseClient,
  userId: string,
  analysis: FullBinAnalysis,
): Promise<void> {
  const { technicalData, threeDSAnalysis, riskAnalysis, dataQuality } = analysis

  // Nunca armazenar PAN completo — apenas BIN (6-8 dígitos)
  const binToStore = analysis.bin.substring(0, 8)

  const { error } = await supabase.from("bin_analysis_logs").insert({
    user_id: userId,
    bin: binToStore,
    bin8: binToStore.length >= 8 ? binToStore : null,
    bin_length: technicalData.binLength,
    source_api: technicalData.source,
    brand: technicalData.brand ?? null,
    country: technicalData.countryName ?? null,
    country_code: technicalData.countryCode ?? null,
    issuer: technicalData.issuer ?? null,
    card_type: technicalData.type ?? null,
    card_category: technicalData.category ?? null,
    type: technicalData.type ?? null,
    category: technicalData.category ?? null,
    is_prepaid: technicalData.isPrepaid ?? false,
    is_commercial: technicalData.isCommercial ?? false,
    three_ds_status_estimated: threeDSAnalysis.status,
    three_ds_confidence: threeDSAnalysis.confidence,
    risk_score: riskAnalysis.score,
    risk_level: riskAnalysis.level,
    recommendation: riskAnalysis.recommendation,
    data_quality_score: dataQuality.score,
    result: analysis,
    created_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}
