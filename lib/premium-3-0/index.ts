// lib/premium-3-0/index.ts
// Orquestrador principal da análise de BIN v2 — Motor Canônico

import type { BinApiData, FullBinAnalysis } from "./types"
import { analyzeThreeDS } from "./analyzeThreeDS"
import { calculateRisk } from "./calculateRisk"
import { calculateDataQuality } from "./calculateDataQuality"
import { analyzeCompliance } from "./analyzeCompliance"
import { generateRecommendation } from "./generateRecommendation"
import type { TransactionContext } from "./holisticEngine"

export function runFullBinAnalysis(binData: BinApiData, context?: Partial<TransactionContext>): FullBinAnalysis {
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

  return { ...partialAnalysis, finalSummary }
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
export { runHolisticAnalysis } from "./holisticEngine"
export { computePeerComparison } from "./peerComparison"
export type { TransactionContext, HolisticScore, HolisticDimensionScore } from "./holisticEngine"
export type { PeerComparison } from "./peerComparison"
export type * from "./types"
