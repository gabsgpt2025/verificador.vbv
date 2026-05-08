/**
 * VeriFiBIN Premium 3.0 - Type Definitions
 *
 * Tipos públicos do contrato (API ↔ UI) são definidos em `holisticTypes.ts`
 * e re-exportados aqui para compatibilidade com imports existentes.
 * Tipos internos do motor ficam neste arquivo.
 */

// ============================================================================
// RE-EXPORTS — tipos públicos do contrato (SSOT: holisticTypes.ts)
// ============================================================================

export type {
  RecommendationAction,
  RiskLevel,
  BypassMechanism,
  CardBrand,
  CardType,
  CardCategory,
  AlertSeverity,
  AlertCategory,
  FraudAlert,
  RiskFactors,
  BINData,
  BINAnalysisResult,
  ThreeDSAnalysis,
  RiskEngineResult,
  MastercardBINLookupResponse,
  MastercardIdentityInsightsResponse,
  LanguageMode,
  ValidationResult,
  AnalysisRequest,
  AnalysisResponse,
  AnalysisSourceSummary,
  MultiSourceConsensus,
  DashboardMetrics,
  HistoryEntry,
} from "./holisticTypes"
import type { BypassMechanism, RiskLevel } from "./holisticTypes"
import type { HolisticDimensionScore, TransactionContext } from "./holisticEngine"

// ============================================================================
// TIPOS DE CONTEXTO INTERNO (não fazem parte do contrato público)
// ============================================================================

export interface ThreeDSContext {
  transactionAmount: number;
  transactionCurrency: string;
  merchantCountry: string;
  cardholderCountry: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
  isNewCard: boolean;
  isFirstTransaction: boolean;
  timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
}

// ============================================================================
// TIPOS MIGRADOS DO MOTOR lib/bin (BIN Analysis v2)
// ============================================================================

export interface NeutrinoBinResponse {
  bin?: string
  valid?: boolean
  card_brand?: string
  card_type?: string
  card_category?: string
  issuer_name?: string
  issuer_website?: string
  issuer_phone?: string
  country_code?: string
  country_name?: string
  country_iso3?: string
  country_continent?: string
  country_population?: number
  currency_code?: string
  currency_name?: string
  is_commercial?: boolean
  is_prepaid?: boolean
  is_3d_secure?: boolean
  risk_level?: string
  [key: string]: unknown
}

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
  source: "NEUTRINO" | "MASTERCARD" | "FRAUDLABS" | "BINLIST" | "INTERNAL" | "UNKNOWN"
  raw?: unknown
}

export type BinThreeDSResult = {
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
  explanation: {
    technical: string
    popular: string
  }
  inferred: boolean
  frictionlessProbability: number
  challengeProbability: number
  bypassProbability: number
  applicableBypassMechanisms: Array<
    "SCA_EXEMPTION_LOW_VALUE" | "TRA" | "RECURRING" | "MIT" | "FRICTIONLESS_3DS2"
  >
  bypassMechanisms?: BypassMechanism[]
}

export interface GeoContext {
  ipCountry: string | null
  ipCity: string | null
  ipCountryCode?: string | null
  ipCountryMatch: boolean
  distanceKm: number | null
  ipCountryTier: "tier1" | "tier2" | "tier3" | "critical"
  countryRiskTier?: string
  score: number
  factors: BinRiskFactor[]
}

export interface TemporalContext {
  hour: number
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
  isWeekend: boolean
  isNightTime: boolean
  isBusinessHours: boolean
  score: number
  factors: BinRiskFactor[]
}

export interface BankReputation {
  approvalRate: number
  fraudRate: number
  threeDsAdoption: number
  threeDsMaturity: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  defaultMethod: "OTP_SMS" | "BIOMETRIC" | "APP_PUSH" | "NONE"
  tier?: "TIER1" | "TIER2" | "TIER3"
}

export interface HistorySummary {
  bin: string
  timestamp: number
  countryCode?: string | null
}

export interface RiskContext {
  binData: BinApiData
  geo: GeoContext
  temporal: TemporalContext
  bank: BankReputation | null
  amount?: number
  currency?: string
  userAgent?: string
  history?: HistorySummary[]
}

export interface PeerComparison {
  percentile: number
  description: string
  similarCount?: number
  cohortKey?: string
  peerCount?: number
  betterThan?: number
  peerGroup?: string
}

export type HolisticContext = Partial<TransactionContext>

export interface HolisticRiskAnalysis {
  overallScore: number
  level?: RiskLevel
  riskLevel?: RiskLevel
  recommendation: "APPROVE" | "REVIEW" | "REQUIRE_3DS" | "BLOCK_PREVENTIVELY" | "INSUFFICIENT_DATA"
  ensembleConfidence: number
  dimensions: {
    binRisk: HolisticDimensionScore
    temporalRisk: HolisticDimensionScore
    behavioralRisk: HolisticDimensionScore
    geographicRisk: HolisticDimensionScore
    deviceRisk: HolisticDimensionScore
    gatewayRisk: HolisticDimensionScore
  }
}

export type BinRiskFactor = {
  label: string
  impact: number
  reason: string
}

export type BinRiskAnalysis = {
  score: number
  level: RiskLevel
  recommendation:
    | "ALLOW_WITH_MONITORING"
    | "REVIEW"
    | "REQUIRE_3DS"
    | "BLOCK_PREVENTIVELY"
    | "INSUFFICIENT_DATA"
  factors: BinRiskFactor[]
}

export type BinDataQualityAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH"
  missingFields: string[]
  realApiFields: string[]
  inferredFields: string[]
}

export type BinComplianceAnalysis = {
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
  threeDSAnalysis: BinThreeDSResult
  riskAnalysis: BinRiskAnalysis
  dataQuality: BinDataQualityAnalysis
  compliance: BinComplianceAnalysis
  finalSummary: {
    title: string
    message: string
    action: string
  }
  holistic?: HolisticRiskAnalysis
  peerComparison?: PeerComparison
}

export type BinAnalysisV2Request = {
  bin: string
  amount?: number
  currency?: string
  mcc?: string
  userAgent?: string | null
  ipAddress?: string | null
  merchantCountry?: string
  isFirstTransaction?: boolean
  context?: HolisticContext
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

export interface LegacyBINAnalysisResult {
  bin: string
  brand: string
  type: string
  level: string
  bank: string
  country: string
  currency: string
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  analysis: {
    aiInsights: string
    fraudIndicators: string[]
    recommendations: string[]
    bypassProbability: number
    threeDSStatus: string
    vbvStatus: string
  }
  conversions: {
    [currency: string]: number
  }
  metadata: {
    analysisDate: string
    processingTime: number
    confidence: number
  }
}
