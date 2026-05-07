/**
 * Sistema Holístico de Análise Anti-Fraude
 * Tipos TypeScript para integração de múltiplas fontes de dados
 */

// ============================================================================
// 1. NORMALIZED CARD DATA
// ============================================================================

export interface NormalizedCardData {
  // Identificação
  bin: string;
  binLength: 6 | 8 | 10;

  // Dados da API Neutrino/Mastercard
  cardBrand: "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER" | "OTHER";
  cardType: "DEBIT" | "CREDIT" | "CHARGE_CARD" | "PREPAID";
  cardCategory:
    | "CLASSIC"
    | "GOLD"
    | "PLATINUM"
    | "BLACK"
    | "BUSINESS"
    | "CORPORATE"
    | "VIRTUAL";

  // Emissor
  issuer: string;
  issuerCountry: string; // ISO 2-letter code
  issuerCountryName: string;
  issuerWebsite?: string;
  issuerPhone?: string;

  // Características
  isCommercial: boolean;
  isPrepaid: boolean;
  isReloadable: boolean;
  isCorporate: boolean;
  isVirtual: boolean;

  // Dados Geográficos (IP)
  customerIp?: string;
  customerCountry?: string;
  customerRegion?: string;
  customerCity?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  ipCountryMatch: boolean;
  ipBlocklisted: boolean;
  ipBlocklists?: string[];

  // Dados Proprietários
  threeDsActiveProbability: number; // 0-100
  frictionlessProbability: number; // 0-100
  bypassProbability: number; // 0-100
  bypassMechanism:
    | "NONE"
    | "FRICTIONLESS_3DS2"
    | "SCA_EXEMPTION"
    | "3DS_NOMINAL";

  // Dados Históricos
  countryMaturity3ds: number; // 0-100
  countryApprovalRate: number; // 0-100
  countryChargebackRate: number; // 0-100
  countryFraudRate: number; // 0-100

  bankApprovalRate: number; // 0-100
  bankChargebackRate: number; // 0-100
  bankFraudRate: number; // 0-100
  bankAntiFraudLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

  // Dados de Transação
  transactionCount: number;
  approvalCount: number;
  declineCount: number;
  chargebackCount: number;
  fraudCount: number;
  averageTransactionValue: number;

  // Metadados
  dataQuality: number; // 0-100
  lastUpdated: Date;
  sources: string[];
}

// ============================================================================
// 2. ENRICHED CARD DATA
// ============================================================================

export interface EnrichedCardData extends NormalizedCardData {
  // Análise de Correlação
  correlationAnalysis: {
    countryRiskCorrelation: number; // -1 a 1
    bankRiskCorrelation: number; // -1 a 1
    cardTypeRiskCorrelation: number; // -1 a 1
    ipCountryRiskCorrelation: number; // -1 a 1
  };

  // Detecção de Anomalias
  anomalies: {
    isHighRiskCountry: boolean;
    isHighRiskBank: boolean;
    isHighRiskCardType: boolean;
    isIpCountryMismatch: boolean;
    isIpBlocklisted: boolean;
    isUnusualPattern: boolean;
    anomalyScore: number; // 0-100
  };

  // Enriquecimento de Contexto
  context: {
    countryRiskLevel:
      | "VERY_LOW"
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "VERY_HIGH";
    bankRiskLevel: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    cardRiskLevel: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    overallRiskLevel:
      | "VERY_LOW"
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "VERY_HIGH";

    behaviorPattern: "NORMAL" | "SUSPICIOUS" | "FRAUDULENT";
    behaviorScore: number; // 0-100

    comparisonWithPeers: {
      betterThanAverage: boolean;
      percentileRank: number; // 0-100
      similarCards: number;
    };
  };

  // Flags de Risco
  riskFlags: string[];

  // Score de Confiança dos Dados
  dataConfidenceScore: number; // 0-100
}

// ============================================================================
// 3. PROBABILITY CALCULATION
// ============================================================================

export interface ProbabilityCalculation {
  // 1. Média Ponderada
  weightedAverage: {
    threeDsActive: number;
    frictionless: number;
    bypass: number;
  };

  // 2. ML Pattern Matching
  mlPatternMatching: {
    threeDsActive: number;
    frictionless: number;
    bypass: number;
    confidence: number;
  };

  // 3. Análise Histórica
  historicalAnalysis: {
    threeDsActive: number;
    frictionless: number;
    bypass: number;
    sampleSize: number;
  };

  // 4. Análise de Correlação
  correlationAnalysis: {
    threeDsActive: number;
    frictionless: number;
    bypass: number;
  };

  // 5. Ensemble (Combinação de todas)
  ensemble: {
    threeDsActive: number; // 0-100
    frictionless: number; // 0-100
    bypass: number; // 0-100
    confidenceScore: number; // 0-100
    method:
      | "WEIGHTED_AVERAGE"
      | "ML_ENSEMBLE"
      | "BAYESIAN"
      | "VOTING";
  };
}

// ============================================================================
// 4. HOLISTIC ANALYSIS RESULT
// ============================================================================

export interface HolisticAnalysisResult {
  // Identificação
  bin: string;
  timestamp: Date;

  // Dados Normalizados
  cardData: NormalizedCardData;

  // Dados Enriquecidos
  enrichedData: EnrichedCardData;

  // Probabilidades
  probabilities: {
    threeDsActive: {
      percentage: number; // 0-100
      confidence: number; // 0-100
      level: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    };
    frictionless: {
      percentage: number; // 0-100
      confidence: number; // 0-100
      level: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    };
    bypass: {
      percentage: number; // 0-100
      confidence: number; // 0-100
      level: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
      mechanism:
        | "NONE"
        | "FRICTIONLESS_3DS2"
        | "SCA_EXEMPTION"
        | "3DS_NOMINAL";
    };
  };

  // Scores de Risco
  riskScores: {
    overall: number; // 0-100
    byCountry: number; // 0-100
    byBank: number; // 0-100
    byCardType: number; // 0-100
    byIpGeolocation: number; // 0-100
    byBehavior: number; // 0-100
  };

  // Recomendação
  recommendation: {
    action: "APPROVE" | "CHALLENGE" | "DECLINE" | "REVIEW";
    reason: string;
    confidence: number; // 0-100
  };

  // Explicações
  explanations: {
    technical: {
      summary: string;
      details: string[];
      factors: {
        name: string;
        impact: number; // -100 a 100
        description: string;
      }[];
    };
    popular: {
      summary: string;
      details: string[];
    };
  };

  // Comparação com Pares
  comparison: {
    percentileRank: number; // 0-100
    betterThanAverage: boolean;
    similarCardsAnalyzed: number;
  };

  // Histórico
  history: {
    previousAnalyses: number;
    lastAnalyzed: Date;
    trendAnalysis: "IMPROVING" | "STABLE" | "DECLINING";
  };

  // Metadados
  metadata: {
    dataQuality: number; // 0-100
    sourcesUsed: string[];
    calculationTime: number; // ms
    version: string;
  };
}

// ============================================================================
// 5. DATA SOURCE
// ============================================================================

export interface DataSource {
  name: string;
  type: "API" | "DATABASE" | "HISTORICAL" | "PROPRIETARY";
  priority: number; // 1-10
  updateFrequency: "REALTIME" | "DAILY" | "WEEKLY" | "MONTHLY";
  dataElements: string[];
  isActive: boolean;
  lastSyncTime?: Date;
  errorCount?: number;
}

// ============================================================================
// 6. MARKET DATA
// ============================================================================

export interface CountryMarketData {
  country: string;
  countryCode: string;
  countryName: string;
  maturity3ds: number; // 0-100
  approvalRate: number; // 0-100
  chargebackRate: number; // 0-100
  fraudRate: number; // 0-100
  riskLevel: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
}

export interface BankMarketData {
  bankName: string;
  country: string;
  threeDsActive: number;
  frictionless: number;
  bypass: number;
  approvalRate: number;
  chargebackRate: number;
  fraudRate: number;
  antiFraudLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
}

// ============================================================================
// 7. CONFIDENCE LEVELS
// ============================================================================

export type ConfidenceLevel =
  | "VERY_LOW"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH";

export type RiskLevel =
  | "VERY_LOW"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH";

export type RecommendationAction =
  | "APPROVE"
  | "CHALLENGE"
  | "DECLINE"
  | "REVIEW";

export type BypassMechanism =
  | "NONE"
  | "FRICTIONLESS_3DS2"
  | "SCA_EXEMPTION"
  | "3DS_NOMINAL";
