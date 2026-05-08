/**
 * VeriFiBIN Premium 3.0 - Type Definitions
 * Tipos e interfaces para o motor de inteligência anti-fraude completo
 */

// ============================================================================
// TIPOS DE ANÁLISE DE BIN
// ============================================================================

export interface BINData {
  bin: string;
  country: string;
  issuerName: string;
  productType: 'CREDIT' | 'DEBIT' | 'PREPAID' | 'UNKNOWN';
  cardLevel: 'STANDARD' | 'GOLD' | 'PLATINUM' | 'BLACK' | 'UNKNOWN';
  isReloadable: boolean;
  issuingNetwork: 'MASTERCARD' | 'VISA' | 'AMEX' | 'OTHER';
  lastUpdated: string;
}

export interface BINAnalysisResult {
  bin: string;
  binData: BINData;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frictionlessLikelihood: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  bypassMechanism: 'NONE' | 'FRICTIONLESS_3DS2' | 'SCA_EXEMPTION' | '3DS_NOMINAL' | 'UNKNOWN';
  alerts: FraudAlert[];
  recommendations: string[];
}

// ============================================================================
// TIPOS DE ANÁLISE 3DS
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

export interface ThreeDSAnalysis {
  challengeLikelihood: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  frictionlessLikelihood: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendedFlow: 'FRICTIONLESS' | 'CHALLENGE' | 'HYBRID';
  estimatedSuccessRate: number; // 0-100
  explanation: {
    technical: string;
    popular: string;
  };
}

// ============================================================================
// TIPOS DE ALERTAS DE FRAUDE
// ============================================================================

export type AlertSeverity = 'INFO' | 'AVISO' | 'ALTO' | 'CRÍTICO';
export type AlertCategory = 'COMPORTAMENTO_3DS' | 'BYPASS' | 'COMPORTAMENTAL' | 'TEMPORAL' | 'GATEWAY' | 'CONFORMIDADE';

export interface FraudAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: {
    technical: string;
    popular: string;
  };
  riskImpact: number; // 0-100
  detectionMethod: string;
  timestamp: string;
}

// ============================================================================
// TIPOS DE MOTOR DE RISCO
// ============================================================================

export interface RiskFactors {
  binRisk: number;
  temporalRisk: number;
  behavioralRisk: number;
  geographicRisk: number;
  deviceRisk: number;
  gatewayRisk: number;
}

export interface RiskEngineResult {
  overallRiskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactors;
  recommendations: {
    action: 'APPROVE' | 'CHALLENGE' | 'DECLINE' | 'REVIEW';
    confidence: number; // 0-100
    reasoning: {
      technical: string;
      popular: string;
    };
  };
  alerts: FraudAlert[];
}

// ============================================================================
// TIPOS DE INTEGRAÇÃO MASTERCARD
// ============================================================================

export interface MastercardBINLookupResponse {
  bin: string;
  accountRanges: Array<{
    startBin: string;
    endBin: string;
    country: string;
    issuerName: string;
    productType: string;
    cardLevel: string;
  }>;
  lastUpdated: string;
}

export interface MastercardIdentityInsightsResponse {
  transactionRiskScore: number; // 0-100
  recommendedAction: 'APPROVE' | 'CHALLENGE' | 'DECLINE';
  confidenceLevel: number; // 0-100
  riskIndicators: string[];
}

// ============================================================================
// TIPOS DE CONTEXTO E CONFIGURAÇÃO
// ============================================================================

export interface LanguageMode {
  mode: 'TECHNICAL' | 'POPULAR';
  label: string;
  description: string;
}

export interface AnalysisRequest {
  bin: string;
  transactionAmount: number;
  transactionCurrency: string;
  merchantCountry: string;
  cardholderCountry: string;
  deviceType: string;
  isNewCard: boolean;
  isFirstTransaction: boolean;
  additionalContext?: Record<string, any>;
}

export interface AnalysisResponse {
  requestId: string;
  timestamp: string;
  binAnalysis: BINAnalysisResult;
  threeDSAnalysis: ThreeDSAnalysis;
  riskAnalysis: RiskEngineResult;
  masterCardIntegration?: {
    binLookup: MastercardBINLookupResponse;
    identityInsights: MastercardIdentityInsightsResponse;
  };
  languageMode: LanguageMode;
}

// ============================================================================
// TIPOS DE DASHBOARD E UI
// ============================================================================

export interface DashboardMetrics {
  totalAnalyses: number;
  averageRiskScore: number;
  highRiskTransactions: number;
  frictionlessRate: number;
  mastercardIntegrationStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export interface HistoryEntry {
  id: string;
  bin: string;
  timestamp: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'APPROVE' | 'CHALLENGE' | 'DECLINE' | 'REVIEW';
  mastercardVerified: boolean;
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
  source: "NEUTRINO" | "FRAUDLABS" | "BINLIST" | "INTERNAL" | "UNKNOWN"
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
  explanation: string
  inferred: boolean
}

export type BinRiskFactor = {
  label: string
  impact: number
  reason: string
}

export type BinRiskAnalysis = {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
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
