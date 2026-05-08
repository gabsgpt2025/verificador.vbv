/**
 * VeriFiBIN Premium 3.0 — Holistic Types (SSOT)
 *
 * Este arquivo é a fonte única de verdade (SSOT) para todos os tipos públicos
 * do contrato API ↔ UI.  Tipos internos do motor (BinApiData, FullBinAnalysis
 * etc.) continuam em `types.ts`.
 *
 * Regra: qualquer arquivo que precise de `RecommendationAction`, `RiskLevel`,
 * `BypassMechanism`, `AnalysisRequest` ou `AnalysisResponse` deve importar
 * daqui, não de `types.ts`.
 */

// ============================================================================
// ENUMS CANÔNICOS — literais reais produzidos pelo motor
// ============================================================================

/** Ações de recomendação produzidas pelo adapter mapFullBinAnalysisToResponse. */
export type RecommendationAction = "APPROVE" | "CHALLENGE" | "DECLINE" | "REVIEW"

/**
 * Nível de risco real produzido pelo motor (calculateRisk / RiskEngineResult).
 * "VERY_LOW" e "VERY_HIGH" NÃO são produzidos — use Likelihood para frictionless/challenge.
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

/**
 * Mecanismo de bypass 3DS calculado pelo adapter.
 * "UNKNOWN" é retornado apenas quando recommendedFlow não corresponde a nenhum
 * dos casos mapeados (defensivo).
 */
export type BypassMechanism =
  | "NONE"
  | "FRICTIONLESS_3DS2"
  | "SCA_EXEMPTION"
  | "3DS_NOMINAL"
  | "UNKNOWN"

/** Bandeira emissora do cartão (issuingNetwork). */
export type CardBrand = "MASTERCARD" | "VISA" | "AMEX" | "OTHER"

/** Tipo de produto do cartão. */
export type CardType = "CREDIT" | "DEBIT" | "PREPAID" | "UNKNOWN"

/** Categoria / nível do cartão. */
export type CardCategory = "STANDARD" | "GOLD" | "PLATINUM" | "BLACK" | "UNKNOWN"

// ============================================================================
// TIPOS DE SUPORTE (alertas, fatores de risco)
// ============================================================================

export type AlertSeverity = "INFO" | "AVISO" | "ALTO" | "CRÍTICO"
export type AlertCategory =
  | "COMPORTAMENTO_3DS"
  | "BYPASS"
  | "COMPORTAMENTAL"
  | "TEMPORAL"
  | "GATEWAY"
  | "CONFORMIDADE"

export interface FraudAlert {
  id: string
  category: AlertCategory
  severity: AlertSeverity
  title: string
  description: {
    technical: string
    popular: string
  }
  riskImpact: number // 0-100
  detectionMethod: string
  timestamp: string
}

export interface RiskFactors {
  binRisk: number
  temporalRisk: number
  behavioralRisk: number
  geographicRisk: number
  deviceRisk: number
  gatewayRisk: number
}

// ============================================================================
// TIPOS DE DADOS DO BIN (contrato público)
// ============================================================================

export interface BINData {
  bin: string
  country: string
  issuerName: string
  productType: CardType
  cardLevel: CardCategory
  isReloadable: boolean
  issuingNetwork: CardBrand
  lastUpdated: string
}

export interface BINAnalysisResult {
  bin: string
  binData: BINData
  riskScore: number // 0-100
  riskLevel: RiskLevel
  frictionlessLikelihood: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  bypassMechanism: BypassMechanism
  alerts: FraudAlert[]
  recommendations: string[]
}

// ============================================================================
// TIPOS DE ANÁLISE 3DS (contrato público)
// ============================================================================

export interface ThreeDSAnalysis {
  challengeLikelihood: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  frictionlessLikelihood: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  recommendedFlow: "FRICTIONLESS" | "CHALLENGE" | "HYBRID"
  estimatedSuccessRate: number // 0-100
  explanation: {
    technical: string
    popular: string
  }
}

// ============================================================================
// MOTOR DE RISCO (contrato público)
// ============================================================================

export interface RiskEngineResult {
  overallRiskScore: number // 0-100
  riskLevel: RiskLevel
  riskFactors: RiskFactors
  recommendations: {
    action: RecommendationAction
    confidence: number // 0-100
    reasoning: {
      technical: string
      popular: string
    }
  }
  alerts: FraudAlert[]
}

// ============================================================================
// INTEGRAÇÕES MASTERCARD
// ============================================================================

export interface MastercardBINLookupResponse {
  bin: string
  accountRanges: Array<{
    startBin: string
    endBin: string
    country: string
    issuerName: string
    productType: string
    cardLevel: string
  }>
  lastUpdated: string
}

export interface MastercardIdentityInsightsResponse {
  transactionRiskScore: number // 0-100
  recommendedAction: RecommendationAction
  confidenceLevel: number // 0-100
  riskIndicators: string[]
}

// ============================================================================
// MODO DE LINGUAGEM
// ============================================================================

export interface LanguageMode {
  mode: "TECHNICAL" | "POPULAR"
  label: string
  description: string
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

/** Resultado de validação discriminado — use em funções de validação de input. */
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ============================================================================
// CONTRATO DE BORDA: AnalysisRequest / AnalysisResponse
// ============================================================================

/** Payload aceito pelo endpoint POST /api/bin-analysis-v2. */
export interface AnalysisRequest {
  /**
   * Primeiros 6–8 dígitos do cartão (somente números).
   * Formato validado em runtime via `validateAnalysisRequest` no route handler.
   */
  bin: string
  context?: {
    amount?: number
    currency?: string
    merchantCountry?: string
    merchantCategoryCode?: string
    mcc?: string
    timestamp?: number
    userAgent?: string | null
    ipAddress?: string | null
    ipCountryCode?: string | null
    isFirstTransaction?: boolean
  }
  transactionAmount?: number
  transactionCurrency?: string
  merchantCountry?: string
  mcc?: string
  cardholderCountry?: string
  deviceType?: "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN"
  isNewCard?: boolean
  isFirstTransaction?: boolean
  additionalContext?: Record<string, unknown>
}

export interface AnalysisSourceSummary<T = unknown> {
  available: boolean
  country?: string | null
  brand?: string | null
  type?: string | null
  issuer?: string | null
  data?: T | null
}

export interface MultiSourceConsensus {
  countryAgreement: boolean
  brandAgreement: boolean
  typeAgreement: boolean
  confidence: "HIGH" | "MEDIUM" | "LOW"
  discrepancies: string[]
}

/** Resposta do endpoint POST /api/bin-analysis-v2 (shape legado mantido para compatibilidade). */
export interface AnalysisResponse {
  requestId: string
  timestamp: string
  binAnalysis: BINAnalysisResult
  threeDSAnalysis: ThreeDSAnalysis
  riskAnalysis: RiskEngineResult
  masterCardIntegration?: {
    binLookup: MastercardBINLookupResponse
    identityInsights: MastercardIdentityInsightsResponse
  }
  languageMode: LanguageMode
}

// ============================================================================
// TIPOS DE DASHBOARD E UI
// ============================================================================

export interface DashboardMetrics {
  totalAnalyses: number
  averageRiskScore: number
  highRiskTransactions: number
  frictionlessRate: number
  mastercardIntegrationStatus: "CONNECTED" | "DISCONNECTED" | "ERROR"
}

export interface HistoryEntry {
  id: string
  bin: string
  timestamp: string
  riskScore: number
  riskLevel: RiskLevel
  action: RecommendationAction
  mastercardVerified: boolean
}

// ============================================================================
// FASE 5 — ANÁLISE ANTIFRAUDE DE SESSÃO
// ============================================================================

/** Ação recomendada para a sessão do visitante (antifraude session). */
export type SessionRiskRecommendation = "ALLOW" | "REVIEW" | "CHALLENGE" | "BLOCK"

/** Flags de rede derivadas de IP Blocklist + IP Info (Neutrino Tier 1). */
export interface NetworkFlags {
  isTor: boolean
  isProxy: boolean
  isVpn: boolean
  isHijacked: boolean
  isSpider: boolean
  isMalware: boolean
  isBot: boolean
  isListed: boolean
  blocklistCount: number
}

/** Informações de dispositivo derivadas de UA Lookup (Neutrino Tier 1). */
export interface DeviceInfo {
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  deviceType: "MOBILE" | "DESKTOP" | "TABLET" | "BOT" | "UNKNOWN"
  isMobile: boolean
  isBot: boolean
}

/** Resposta do endpoint POST /api/antifraud-session. */
export interface SessionRiskResponse {
  /** IP real do visitante (never serialized to client — use ipMasked). */
  ip: string | null
  /** IP parcialmente mascarado para exibição segura (ex: "201.x.x.42"). */
  ipMasked: string
  geo: {
    country: string | null
    city: string | null
    isp: string | null
    asn: string | null
    hostname: string | null
  }
  network: NetworkFlags
  device: DeviceInfo
  hostReputation: {
    score: number | null
    listed: boolean
    categories: string[]
  } | null
  client: {
    fingerprint: string | null
    timezone: string | null
    languages: string[]
    screen: { w: number; h: number; colorDepth: number } | null
  }
  /** Score de risco da sessão (0–100). */
  riskScore: number
  riskLevel: RiskLevel
  recommendation: SessionRiskRecommendation
  /** Fatores que contribuíram para o score final. */
  factors: Array<{ label: string; impact: number; reason: string }>
  /** Fontes de dados usadas nesta análise (ex: "neutrino:ip-info"). */
  sourcesUsed: string[]
  /** Timestamp ISO 8601 de quando a análise foi gerada. */
  generatedAt: string
}
