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
  sourcesConfirmed?: number
  sourcesTotal?: number
}

export interface SourceDiagnostic {
  source: "neutrino" | "mastercard" | "binlist"
  status: "ok" | "error" | "timeout" | "disabled" | "not_applicable"
  httpStatus?: number | null
  latencyMs?: number | null
  message: string
  missingEnvVars?: string[]
  suggestedAction?: string
  lastSuccessAt?: string | null
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

  // ── FASE 2: Campos de enriquecimento via APIs externas ──

  /**
   * Risco da sessão derivado de Neutrino (ip-info, ip-blocklist, ua-lookup, host-reputation).
   * `null` quando nenhum dado de IP/UA foi fornecido na requisição.
   */
  sessionRisk?: SessionRiskSummary | null

  /**
   * Resultado do FraudLabs Pro.
   * `null` quando a API está desabilitada ou falhou.
   */
  fraudLabs?: FraudLabsSummary | null

  /**
   * Dados dos serviços Mastercard Enhanced (Identity Insights + Fraud Scoring).
   * Ambos os campos podem ser `null` individualmente se a respectiva chamada falhar.
   */
  mastercardEnhanced?: MastercardEnhancedSummary

  /**
   * Proveniência de cada fonte de dado utilizada na análise enriquecida.
   * Indica qual API forneceu cada categoria de dado e a confiança geral.
   */
  dataProvenance?: DataProvenanceSummary

  /**
   * Diagnósticos de cada API externa chamada (latência, status, erros).
   * Útil para debug e monitoramento de integrações.
   */
  apiDiagnostics?: ApiDiagnosticEntry[]

  /**
   * Análise holística multidimensional (6 ou 7 dimensões quando há dados de APIs externas).
   * Inclui scores individuais por dimensão, score geral, recomendação e confiança do ensemble.
   */
  holistic?: HolisticScoreSummary

  /**
   * Comparação com pares (percentil do BIN em relação a BINs similares).
   */
  peerComparison?: PeerComparisonSummary

  /**
   * Informações sobre taxas de câmbio utilizadas na análise.
   */
  exchangeRatesUsed?: { source: string; lastUpdated: string } | null
}

// ============================================================================
// TIPOS DE SUPORTE PARA AnalysisResponse (FASE 2)
// ============================================================================

/** Resumo do risco de sessão retornado na resposta da API. */
export interface SessionRiskSummary {
  /** Score de risco da sessão (0–100). */
  score: number
  /** Nível de risco. */
  level: RiskLevel
  /** Ação recomendada para a sessão. */
  recommendation: SessionRiskRecommendation
  /** Flags de rede (TOR, VPN, proxy, etc.). */
  network: NetworkFlags
  /** Informações de dispositivo (browser, OS, tipo). */
  device: DeviceInfo
  /** IP parcialmente mascarado para exibição segura. */
  ipMasked: string
  /** Geolocalização do IP. */
  geo: {
    country: string | null
    city: string | null
    isp: string | null
    asn: string | null
    hostname: string | null
  }
  /** Fatores que contribuíram para o score. */
  factors: Array<{ label: string; impact: number; reason: string }>
  /** Fontes de dados usadas. */
  sourcesUsed: string[]
}

/** Resumo do FraudLabs Pro retornado na resposta da API. */
export interface FraudLabsSummary {
  /** Score de fraude (0–100). */
  fraudScore: number
  /** Status da decisão. */
  status: "APPROVE" | "REJECT" | "REVIEW"
  /** Se o IP é proxy. */
  isProxy: boolean
  /** Se o país do IP corresponde ao BIN. */
  isCountryMatch: boolean
  /** Se o IP está em blacklist. */
  isIpBlacklisted: boolean
  /** Se é país de alto risco. */
  isHighRiskCountry: boolean
  /** Se o BIN é pré-pago. */
  isBinPrepaid: boolean
  /** País do BIN detectado. */
  binCountry: string | null
  /** Emissor do BIN. */
  binIssuer: string | null
}

/** Resumo dos serviços Mastercard Enhanced retornados na resposta da API. */
export interface MastercardEnhancedSummary {
  /** Resultado do Identity Insights. */
  identity: MastercardIdentityInsightsSummary | null
  /** Resultado do Fraud Scoring. */
  fraudScore: MastercardFraudScoreSummary | null
}

/** Dados do Mastercard Identity Insights. */
export interface MastercardIdentityInsightsSummary {
  /** Score de confiança da identidade (0–100). */
  identityScore: number
  /** Indicadores de risco encontrados. */
  riskIndicators: string[]
  /** Recomendação. */
  recommendation: "APPROVE" | "REVIEW" | "DECLINE"
  /** Fonte. */
  source: string
  /** Timestamp. */
  queriedAt: string
}

/** Dados do Mastercard Fraud Scoring. */
export interface MastercardFraudScoreSummary {
  /** Score de fraude (0–999, menor = menos risco). */
  fraudScore: number
  /** Score normalizado para 0–100. */
  fraudScoreNormalized: number
  /** Códigos de razão do score. */
  reasonCodes: string[]
  /** Nível de risco. */
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  /** Fonte. */
  source: string
  /** Timestamp. */
  queriedAt: string
}

/** Proveniência de dados do enriquecimento. */
export interface DataProvenanceSummary {
  /** Fonte dos dados do BIN. */
  binData: string
  /** Fonte dos dados de risco de sessão. */
  sessionRisk: string
  /** Fonte dos dados de fraude. */
  fraudScoring: string
  /** Fonte dos dados de identidade. */
  identityCheck: string
  /** Fonte dos dados de IP avançado. */
  ipProbe: string
  /** Confiança geral nos dados. */
  overallConfidence: "HIGH" | "MEDIUM" | "LOW"
}

/** Diagnóstico de uma chamada a API externa. */
export interface ApiDiagnosticEntry {
  /** Nome da API. */
  api: string
  /** Status da chamada. */
  status: "success" | "error" | "disabled" | "skipped"
  /** Latência em milissegundos. */
  latencyMs: number
  /** Mensagem descritiva. */
  message: string
}

/** Resumo do score holístico retornado na resposta da API. */
export interface HolisticScoreSummary {
  /** Score geral (0–100). */
  overallScore: number
  /** Nível de risco. */
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  /** Recomendação. */
  recommendation: "APPROVE" | "REVIEW" | "REQUIRE_3DS" | "BLOCK_PREVENTIVELY" | "INSUFFICIENT_DATA"
  /** Confiança do ensemble (0–100). */
  ensembleConfidence: number
  /** Fontes de dados usadas. */
  sourcesUsed: string[]
  /** Comparação com pares (inline no holístico). */
  peerComparison: { percentile: number; description: string }
  /** Dimensões individuais. */
  binRisk: HolisticDimensionSummary
  temporalRisk: HolisticDimensionSummary
  behavioralRisk: HolisticDimensionSummary
  geographicRisk: HolisticDimensionSummary
  deviceRisk: HolisticDimensionSummary
  gatewayRisk: HolisticDimensionSummary
  /** 7ª dimensão: risco de APIs externas (presente apenas quando há dados). */
  externalApiRisk?: HolisticDimensionSummary
}

/** Dimensão individual do score holístico. */
export interface HolisticDimensionSummary {
  /** Score da dimensão (0–100). */
  score: number
  /** Peso da dimensão no score geral. */
  weight: number
  /** Fatores que contribuíram. */
  factors: Array<{ label: string; impact: number; reason: string }>
  /** Explicação técnica e popular. */
  explanation: { technical: string; popular: string }
  /** Se havia dados disponíveis para esta dimensão. */
  dataAvailable: boolean
}

/** Comparação com pares (peer comparison). */
export interface PeerComparisonSummary {
  /** Percentil do BIN (1–99). */
  percentile: number
  /** Descrição textual do posicionamento. */
  description: string
  /** Número de BINs na amostra. */
  similarCount?: number
  /** Chave da coorte usada. */
  cohortKey?: string
  /** Quantidade de pares. */
  peerCount?: number
  /** Porcentagem de pares com score pior. */
  betterThan?: number
  /** Grupo de pares. */
  peerGroup?: string
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
