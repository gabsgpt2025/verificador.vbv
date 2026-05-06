// lib/bin/types.ts
// VeriFiBIN 2.0 — Modelos de Dados Centrais

export type BinApiData = {
  bin: string
  binLength: number
  brand?: string
  type?: string
  category?: string
  countryCode?: string
  countryName?: string
  currency?: string
  issuer?: string | null
  issuerWebsite?: string | null
  issuerPhone?: string | null
  isCommercial?: boolean
  isPrepaid?: boolean
  source: "NEUTRINO" | "FRAUDLABS" | "BINLIST" | "INTERNAL" | "UNKNOWN"
  raw?: unknown
}

export type ThreeDSAnalysis = {
  status:
    | "CONFIRMED_ACTIVE"
    | "CONFIRMED_INACTIVE"
    | "LIKELY_ACTIVE"
    | "LIKELY_INACTIVE"
    | "UNKNOWN"
  confidence: "LOW" | "MEDIUM" | "HIGH"
  challengeLikelihood: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
  protocolLikely:
    | "EMV_3DS_1"
    | "EMV_3DS_2"
    | "EMV_3DS_2_1"
    | "EMV_3DS_2_2"
    | "UNKNOWN"
  authMethodsLikely: string[]
  explanation: string
  inferred: boolean
}

export type RiskFactor = {
  label: string
  impact: number
  reason: string
}

export type RiskAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendation:
    | "ALLOW_WITH_MONITORING"
    | "REVIEW"
    | "REQUIRE_3DS"
    | "BLOCK_PREVENTIVELY"
    | "INSUFFICIENT_DATA"
  factors: RiskFactor[]
}

export type DataQualityAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH"
  missingFields: string[]
  realApiFields: string[]
  inferredFields: string[]
}

export type ComplianceAnalysis = {
  regulatoryRegion: string
  threeDSMandateLevel:
    | "MANDATORY"
    | "STRONG"
    | "MODERATE"
    | "OPTIONAL"
    | "LOW"
    | "UNKNOWN"
  regulationNote: string
  complianceRisk: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
}

export type FullBinAnalysis = {
  bin: string
  source: {
    provider: string
    rawDataAvailable: boolean
    apiConfidence: "LOW" | "MEDIUM" | "HIGH"
  }
  technicalData: BinApiData
  threeDSAnalysis: ThreeDSAnalysis
  riskAnalysis: RiskAnalysis
  dataQuality: DataQualityAnalysis
  compliance: ComplianceAnalysis
  finalSummary: {
    title: string
    message: string
    action: string
  }
}

export type BinAnalysisV2Request = {
  bin: string
}

export type BinOverride = {
  id: string
  bin: string
  field: string
  oldValue: string | null
  correctedValue: string
  confidence: "LOW" | "MEDIUM" | "HIGH"
  reason: string
  source: string
  updatedBy: string
  updatedAt: string
}
