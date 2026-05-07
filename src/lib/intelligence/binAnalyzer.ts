// VeriFiBIN 2.0 — Main BIN Analyzer Orchestrator (Enhanced)
// Coordinates all analysis modules and produces the standard JSON shape
// Enhanced with: issuer intelligence, fraud alerts, frictionless detection, bypass classification

import type {
  BINAnalysisV2Result,
  RawBINApiResponse,
  TechnicalData,
  AnalysisSource,
} from "./types"
import { analyzeThreeDSProfile, type ThreeDSAnalysisEnhanced } from "./threeDSAnalyzer"
import { calculateRiskScore, getIssuerProfileForBin } from "./riskEngine"
import { buildComplianceData } from "./complianceModule"
import { assessDataQuality } from "./dataQuality"
import { buildFinalSummary } from "./recommendationModule"
import { generateFraudAlerts, calculateAlertRiskImpact, type FraudAlert } from "./fraudAlerts"
import type { IssuerProfile } from "./issuerIntelligence"

const MODEL_VERSION = "2.1.0"

// ─── Extended Result with Enhanced Fields ─────────────────────────────────

export interface BINAnalysisV2ResultEnhanced extends BINAnalysisV2Result {
  threeDSAnalysis: ThreeDSAnalysisEnhanced
  fraudAlerts: FraudAlert[]
  issuerProfile: IssuerProfile | null
  metadata: {
    analysisDate: string
    processingTimeMs: number
    modelVersion: string
    issuerIntelligenceUsed: boolean
    alertCount: number
    criticalAlertCount: number
  }
}

// ─── Normalize raw API data ────────────────────────────────────────────────

function normalizeApiResponse(raw: RawBINApiResponse, bin: string): TechnicalData {
  // Support multiple API response formats (BinList, Neutrino, FraudLabs, etc.)
  const brand = (
    raw.brand ??
    raw.scheme ??
    (raw as Record<string, unknown>).card_brand ??
    null
  ) as string | null

  const cardType = (
    raw.type ??
    (raw as Record<string, unknown>).card_type ??
    null
  ) as string | null

  const cardCategory = (
    (raw as Record<string, unknown>).category ??
    (raw as Record<string, unknown>).card_level ??
    (raw as Record<string, unknown>).level ??
    null
  ) as string | null

  const country = (
    raw.country?.name ??
    (raw as Record<string, unknown>).issuer_country ??
    null
  ) as string | null

  const countryCode = (
    raw.country?.alpha2 ??
    (raw as Record<string, unknown>).issuer_country_code ??
    null
  ) as string | null

  const currency = (
    raw.country?.currency ??
    (raw as Record<string, unknown>).currency ??
    null
  ) as string | null

  const issuer = (
    raw.bank?.name ??
    (raw as Record<string, unknown>).issuer_name ??
    (raw as Record<string, unknown>).bank ??
    null
  ) as string | null

  const issuerWebsite = (
    raw.bank?.url ??
    (raw as Record<string, unknown>).issuer_website ??
    null
  ) as string | null

  const issuerPhone = (
    raw.bank?.phone ??
    (raw as Record<string, unknown>).issuer_phone ??
    null
  ) as string | null

  const isPrepaid = (
    raw.prepaid ??
    (raw as Record<string, unknown>).is_prepaid ??
    false
  ) as boolean

  const isCommercial = (
    (raw as Record<string, unknown>).commercial ??
    (raw as Record<string, unknown>).is_commercial ??
    false
  ) as boolean

  // Determine what fields actually came from the API (non-null)
  const realApiFields: string[] = []
  const fieldMap = {
    brand, cardType, cardCategory, country, countryCode,
    currency, issuer, issuerWebsite, issuerPhone,
  }
  for (const [key, val] of Object.entries(fieldMap)) {
    if (val !== null && val !== undefined) realApiFields.push(key)
  }
  if (isPrepaid !== null) realApiFields.push("isPrepaid")
  if (isCommercial !== null) realApiFields.push("isCommercial")

  return {
    bin,
    binLength: bin.length >= 8 ? 8 : 6,
    brand: brand ? brand.toUpperCase() : null,
    cardType: cardType ? cardType.toUpperCase() : null,
    cardCategory: cardCategory ? cardCategory.toUpperCase() : null,
    country,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    currency,
    issuer,
    issuerWebsite,
    issuerPhone,
    isCommercial,
    isPrepaid,
    realApiFields,
    inferredFields: ["threeDSAnalysis", "riskAnalysis", "complianceData", "finalSummary", "fraudAlerts"],
  }
}

// ─── Build Source Info ─────────────────────────────────────────────────────

function buildSource(providerName: string, rawAvailable: boolean): AnalysisSource {
  return {
    provider: providerName,
    rawDataAvailable: rawAvailable,
    apiConfidence: rawAvailable ? "alta" : "baixa",
  }
}

// ─── Main Analyzer ─────────────────────────────────────────────────────────

export interface AnalyzerOptions {
  bin: string
  rawApiResponse: RawBINApiResponse
  providerName?: string
  analysisType?: "basic" | "advanced"
  // Optional context for enhanced risk analysis
  transactionContext?: {
    hour?: number
    dayOfWeek?: number
    isHoliday?: boolean
    amount?: number
    merchantMCC?: string
    attemptCount?: number
    isNewCard?: boolean
    isDependentCard?: boolean
    isVirtualCard?: boolean
    ipCountryCode?: string
  }
}

export function analyzeBIN(options: AnalyzerOptions): BINAnalysisV2ResultEnhanced {
  const startTime = Date.now()

  const {
    bin,
    rawApiResponse,
    providerName = "BINList",
    analysisType = "basic",
    transactionContext = {},
  } = options

  // Step 1: Normalize technical data
  const technicalData = normalizeApiResponse(rawApiResponse, bin)

  // Step 2: Assess data quality
  const dataQuality = assessDataQuality({
    bin,
    brand: technicalData.brand,
    cardType: technicalData.cardType,
    cardCategory: technicalData.cardCategory,
    country: technicalData.country,
    countryCode: technicalData.countryCode,
    currency: technicalData.currency,
    issuer: technicalData.issuer,
    issuerWebsite: technicalData.issuerWebsite,
    issuerPhone: technicalData.issuerPhone,
    isPrepaid: technicalData.isPrepaid,
    isCommercial: technicalData.isCommercial,
  })

  // Step 3: 3DS Analysis (enhanced with issuer intelligence)
  const threeDSAnalysis = analyzeThreeDSProfile({
    bin,
    brand: technicalData.brand,
    cardType: technicalData.cardType,
    cardCategory: technicalData.cardCategory,
    countryCode: technicalData.countryCode,
    issuer: technicalData.issuer,
    isPrepaid: technicalData.isPrepaid,
    isCommercial: technicalData.isCommercial,
  })

  // Step 4: Risk Score (enhanced with context and issuer intelligence)
  const riskAnalysis = calculateRiskScore({
    bin,
    binLength: technicalData.binLength,
    brand: technicalData.brand,
    cardType: technicalData.cardType,
    cardCategory: technicalData.cardCategory,
    countryCode: technicalData.countryCode,
    issuer: technicalData.issuer,
    isPrepaid: technicalData.isPrepaid,
    isCommercial: technicalData.isCommercial,
    dataCompleteness: dataQuality.apiDataCompleteness,
    conflictingDataDetected: dataQuality.conflictingDataDetected,
    // Transaction context
    transactionHour: transactionContext.hour,
    transactionDayOfWeek: transactionContext.dayOfWeek,
    isHoliday: transactionContext.isHoliday,
    transactionAmount: transactionContext.amount,
    merchantMCC: transactionContext.merchantMCC,
    attemptCount: transactionContext.attemptCount,
    isNewCard: transactionContext.isNewCard,
    isDependentCard: transactionContext.isDependentCard,
    isVirtualCard: transactionContext.isVirtualCard,
    ipCountryCode: transactionContext.ipCountryCode,
  })

  // Step 5: Compliance
  const complianceData = buildComplianceData(technicalData.countryCode)

  // Step 6: Get issuer profile
  const issuerProfile = getIssuerProfileForBin(bin, technicalData.issuer)

  // Step 7: Generate fraud alerts
  const fraudAlerts = generateFraudAlerts(
    technicalData,
    threeDSAnalysis,
    riskAnalysis,
    issuerProfile,
  )

  // Step 8: Adjust risk score based on alert impact
  const alertRiskImpact = calculateAlertRiskImpact(fraudAlerts)
  const adjustedScore = Math.min(Math.max(riskAnalysis.score + alertRiskImpact, 0), 100)
  if (alertRiskImpact !== 0) {
    riskAnalysis.score = adjustedScore
    riskAnalysis.riskBreakdown.push({
      factor: `Ajuste por ${fraudAlerts.length} alertas de inteligência de emissor`,
      impact: alertRiskImpact > 0 ? `+${alertRiskImpact}` : `${alertRiskImpact}`,
      numericImpact: alertRiskImpact,
    })
  }

  // Step 9: Final summary / recommendation
  const finalSummary = buildFinalSummary({
    recommendation: riskAnalysis.recommendation,
    riskLevel: riskAnalysis.level,
    riskScore: riskAnalysis.score,
    threeDSStatus: threeDSAnalysis.status,
    threeDSConfidence: threeDSAnalysis.confidence,
    issuerKnown: dataQuality.issuerKnown,
    countryKnown: dataQuality.countryKnown,
    dataQualityScore: dataQuality.score,
    isPrepaid: technicalData.isPrepaid,
    isCommercial: technicalData.isCommercial,
    missingFields: dataQuality.missingFields,
    warnings: dataQuality.warnings,
  })

  const processingTimeMs = Date.now() - startTime
  const criticalAlerts = fraudAlerts.filter(a => a.severity === "CRITICO")

  return {
    bin,
    analysisType,
    source: buildSource(providerName, true),
    technicalData,
    threeDSAnalysis,
    riskAnalysis,
    complianceData,
    dataQuality,
    finalSummary,
    fraudAlerts,
    issuerProfile,
    metadata: {
      analysisDate: new Date().toISOString(),
      processingTimeMs,
      modelVersion: MODEL_VERSION,
      issuerIntelligenceUsed: issuerProfile !== null,
      alertCount: fraudAlerts.length,
      criticalAlertCount: criticalAlerts.length,
    },
  }
}
