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
