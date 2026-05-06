// VeriFiBIN 2.0 — Professional Anti-Fraud Intelligence Model
// All types for the modular analysis result

// ─── Source ────────────────────────────────────────────────────────────────

export type ApiConfidenceLevel = "alta" | "media" | "baixa" | "desconhecida"

export interface AnalysisSource {
  provider: string
  rawDataAvailable: boolean
  apiConfidence: ApiConfidenceLevel
}

// ─── Module 1: Technical Data (Real API Fields) ────────────────────────────

export interface TechnicalData {
  bin: string
  binLength: 6 | 8
  brand: string | null
  cardType: string | null
  cardCategory: string | null
  country: string | null
  countryCode: string | null
  currency: string | null
  issuer: string | null
  issuerWebsite: string | null
  issuerPhone: string | null
  isCommercial: boolean
  isPrepaid: boolean
  // Fields marked as "real API data" vs "inferred"
  realApiFields: string[]
  inferredFields: string[]
}

// ─── Module 2: 3DS/VBV Diagnostic ─────────────────────────────────────────

export type ThreeDSStatus =
  | "ATIVO_PROVAVEL"
  | "INATIVO_PROVAVEL"
  | "DESCONHECIDO"
  | "CONFIRMADO_ATIVO"
  | "CONFIRMADO_INATIVO"

export type ConfidenceLevel = "BAIXA" | "MEDIA" | "ALTA"

export type ThreeDSProtocol =
  | "EMV_3DS_1"
  | "EMV_3DS_2"
  | "EMV_3DS_2_1"
  | "EMV_3DS_2_2"
  | "DESCONHECIDO"

export type AuthMethod = "SMS" | "APP_PUSH" | "BIOMETRIA" | "OTP" | "DESCONHECIDO"

export interface ThreeDSAnalysis {
  status: ThreeDSStatus
  confidence: ConfidenceLevel
  vbvLikely: boolean
  challengeLikelihood: ConfidenceLevel
  protocolLikely: ThreeDSProtocol
  authMethodsLikely: AuthMethod[]
  technicalExplanation: string
  isInferred: true // Always true — APIs don't confirm 3DS directly
}

// ─── Module 3: Risk Score ──────────────────────────────────────────────────

export type RiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO"

export type RecommendationCode =
  | "APROVAR_COM_SEGURANCA"
  | "REVISAR"
  | "EXIGIR_3DS"
  | "BLOQUEAR_PREVENTIVAMENTE"
  | "DADOS_INSUFICIENTES"

export interface RiskBreakdownItem {
  factor: string
  impact: string // e.g. "+10", "-5"
  numericImpact: number
}

export interface RiskAnalysis {
  score: number // 0–100
  level: RiskLevel
  recommendation: RecommendationCode
  riskBreakdown: RiskBreakdownItem[]
}

// ─── Module 4: Compliance ──────────────────────────────────────────────────

export type ThreeDSMandateLevel =
  | "OBRIGATORIO"
  | "FORTE"
  | "MODERADO"
  | "OPCIONAL"
  | "BAIXO"
  | "DESCONHECIDO"

export interface ComplianceData {
  regulatoryRegion: string
  threeDSMandateLevel: ThreeDSMandateLevel
  regulationNote: string
  liabilityShiftExpected: boolean
  complianceRisk: ConfidenceLevel
}

// ─── Module 5: Data Quality ────────────────────────────────────────────────

export interface DataQuality {
  score: number // 0–100
  missingFields: string[]
  realApiFields: string[]
  inferredFields: string[]
  apiDataCompleteness: number // 0–100 percentage
  issuerKnown: boolean
  countryKnown: boolean
  categoryKnown: boolean
  typeKnown: boolean
  conflictingDataDetected: boolean
  warnings: string[]
}

// ─── Module 6: Final Summary ───────────────────────────────────────────────

export interface FinalSummary {
  title: string
  message: string
  action: string
  userFriendlySummary: string
  technicalSummary: string
  recommendedActions: string[]
}

// ─── Full Analysis Result (Standard JSON Shape) ───────────────────────────

export interface BINAnalysisV2Result {
  bin: string
  analysisType: "basic" | "advanced"
  source: AnalysisSource
  technicalData: TechnicalData
  threeDSAnalysis: ThreeDSAnalysis
  riskAnalysis: RiskAnalysis
  complianceData: ComplianceData
  dataQuality: DataQuality
  finalSummary: FinalSummary
  metadata: {
    analysisDate: string
    processingTimeMs: number
    modelVersion: string
  }
}

// ─── Raw API Input (from external BIN lookup) ─────────────────────────────

export interface RawBINApiResponse {
  bin?: string
  scheme?: string // visa, mastercard, etc.
  type?: string // credit, debit, prepaid
  brand?: string // VISA, MASTERCARD, etc.
  prepaid?: boolean
  country?: {
    numeric?: string
    alpha2?: string
    name?: string
    emoji?: string
    currency?: string
    latitude?: number
    longitude?: number
  }
  bank?: {
    name?: string
    url?: string
    phone?: string
    city?: string
  }
  // Allow flexible fields from different providers
  [key: string]: unknown
}
