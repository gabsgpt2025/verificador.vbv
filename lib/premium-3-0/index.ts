// lib/premium-3-0/index.ts
// Orquestrador principal da análise de BIN v2 — Motor Canônico
//
// runFullBinAnalysis() é o ponto central de orquestração: executa todas as
// etapas da análise (3DS, risco, qualidade, compliance, enriquecimento via
// APIs externas, motor holístico e peer comparison) em um único fluxo.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { BinApiData, FullBinAnalysis } from "./types"
import type { HolisticScore, TransactionContext } from "./holisticEngine"
import type { EnrichedAnalysisInput, EnrichedAnalysisResult } from "./services/enrichedAnalysisService"
import type { PeerComparison } from "./peerComparison"
import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateDataQuality } from "./calculateDataQuality"
import { analyzeCompliance } from "./analyzeCompliance"
import { generateRecommendation } from "./generateRecommendation"
import { runHolisticAnalysis } from "./holisticEngine"
import { runEnrichedAnalysis } from "./services/enrichedAnalysisService"
import { computePeerComparison } from "./peerComparison"

// ============================================================================
// Tipos do resultado completo da orquestração
// ============================================================================

/** Resultado completo retornado por runFullBinAnalysis (inclui enriched + holistic + peer). */
export interface FullOrchestrationResult {
  /** Análise base do BIN (3DS, risco, qualidade, compliance, summary). */
  analysis: FullBinAnalysis
  /** Resultado do motor holístico (6 ou 7 dimensões). */
  holistic: HolisticScore
  /** Resultado do enriquecimento via APIs externas (FASE 2). `null` se falhou. */
  enrichedAnalysis: EnrichedAnalysisResult | null
  /** Comparação com pares. */
  peerComparison: PeerComparison
}

// ============================================================================
// Orquestrador principal
// ============================================================================

/**
 * Executa o fluxo completo de análise de BIN:
 *
 * 1. analyzeThreeDS()
 * 2. calculateRisk()
 * 3. calculateDataQuality()
 * 4. analyzeCompliance()
 * 5. generateRecommendation()
 * 6. enrichedAnalysisService.runEnrichedAnalysis() ← APIs externas (FASE 2)
 * 7. runHolisticAnalysis() ← usa dados enriquecidos
 * 8. computePeerComparison()
 *
 * @param binData Dados do BIN normalizados (após overrides)
 * @param context Contexto da transação
 * @param supabase Cliente Supabase para peer comparison
 * @param enrichInput Input para enriquecimento (IP, UA, etc.) — opcional
 */
export async function runFullBinAnalysis(
  binData: BinApiData,
  context: Partial<TransactionContext>,
  supabase: SupabaseClient,
  enrichInput?: EnrichedAnalysisInput,
): Promise<FullOrchestrationResult> {
  // ── Etapas síncronas do motor base ──
  const threeDSAnalysis = analyzeThreeDS(binData, context)
  const riskAnalysis = calculateRisk(binData, threeDSAnalysis)
  const dataQuality = calculateDataQuality(binData)
  const compliance = analyzeCompliance(binData)

  const partialAnalysis = {
    bin: binData.bin,
    source: {
      provider: binData.source,
      rawDataAvailable: binData.raw !== undefined,
      apiConfidence:
        dataQuality.level === "HIGH"
          ? ("HIGH" as const)
          : dataQuality.level === "MEDIUM"
            ? ("MEDIUM" as const)
            : ("LOW" as const),
    },
    technicalData: binData,
    threeDSAnalysis,
    riskAnalysis,
    dataQuality,
    compliance,
  }

  const finalSummary = generateRecommendation(partialAnalysis)
  const analysis: FullBinAnalysis = { ...partialAnalysis, finalSummary }

  // ── FASE 2: Enriquecimento via APIs externas (fail-safe) ──
  let enrichedAnalysis: EnrichedAnalysisResult | null = null
  if (enrichInput) {
    enrichedAnalysis = await runEnrichedAnalysis(enrichInput).catch((error) => {
      console.warn("[runFullBinAnalysis] Enriched analysis failed (non-blocking)", {
        bin: binData.bin.slice(0, 4) + "**",
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    })
  }

  // ── Motor holístico (usa dados enriquecidos quando disponíveis) ──
  const holistic = runHolisticAnalysis(binData, context, enrichedAnalysis ?? undefined)

  // ── Peer comparison ──
  const peerComparison = await computePeerComparison(
    binData,
    supabase,
    riskAnalysis?.score,
  )

  return {
    analysis,
    holistic,
    enrichedAnalysis,
    peerComparison,
  }
}

export { analyzeThreeDS, analyzeThreeDSExtended } from "./analyzeThreeDS"
export { calculateRisk } from "./calculateRisk"
export { calculateDataQuality } from "./calculateDataQuality"
export { analyzeCompliance } from "./analyzeCompliance"
export { generateRecommendation } from "./generateRecommendation"
export { normalizeBinApiResponse } from "./normalizeBinApiResponse"
export { applyBinOverrides } from "./applyBinOverrides"
export { saveBinAnalysisLog } from "./saveBinAnalysisLog"
export { getCountryMaturity, COUNTRY_3DS_MATURITY } from "./country3dsMaturity"
export { calculateHolisticRisk, runHolisticAnalysis } from "./holisticEngine"
export { runEnrichedAnalysis } from "./services/enrichedAnalysisService"
export { computePeerComparison } from "./peerComparison"
export type { TransactionContext, HolisticScore, HolisticDimensionScore } from "./holisticEngine"
export type { EnrichedAnalysisResult, EnrichedAnalysisInput } from "./services/enrichedAnalysisService"
export type { PeerComparison } from "./peerComparison"
export type * from "./types"
