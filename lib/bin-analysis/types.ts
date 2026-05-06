export interface BINAnalysisRequest {
  bin: string
  amount?: number
  currency?: string
}

export interface BINAnalysisResult {
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

export interface RiskFactors {
  geographicRisk: number
  bankReputation: number
  cardTypeRisk: number
  historicalFraud: number
  velocityRisk: number
}
