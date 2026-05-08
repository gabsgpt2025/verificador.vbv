import { describe, expect, it } from "vitest"
import { mapFullBinAnalysisToResponse } from "@/lib/premium-3-0/adapters"
import type { FullBinAnalysis } from "@/lib/premium-3-0/types"

function makeAnalysis(overrides: Partial<FullBinAnalysis> = {}): FullBinAnalysis {
  return {
    bin: "405708",
    source: {
      provider: "INTERNAL",
      rawDataAvailable: true,
      apiConfidence: "HIGH",
    },
    technicalData: {
      bin: "405708",
      binLength: 6,
      source: "INTERNAL",
      brand: "VISA",
      type: "CREDIT",
      category: "GOLD",
      countryCode: "BR",
      countryName: "Brazil",
      issuer: "Banco Exemplo",
      isPrepaid: false,
      isCommercial: false,
    },
    threeDSAnalysis: {
      status: "LIKELY_ACTIVE",
      confidence: "MEDIUM",
      challengeLikelihood: "LOW",
      protocolLikely: "EMV_3DS_2",
      authMethodsLikely: ["OTP"],
      explanation: "Análise inferida",
      inferred: true,
      frictionlessProbability: 82,
      challengeProbability: 18,
      bypassProbability: 64,
      applicableBypassMechanisms: ["FRICTIONLESS_3DS2"],
    },
    riskAnalysis: {
      score: 42,
      level: "MEDIUM",
      recommendation: "REVIEW",
      factors: [],
    },
    dataQuality: {
      score: 90,
      level: "HIGH",
      missingFields: [],
      realApiFields: [],
      inferredFields: [],
    },
    compliance: {
      regulatoryRegion: "LATAM",
      threeDSMandateLevel: "STRONG",
      regulationNote: "Nota",
      complianceRisk: "LOW",
    },
    finalSummary: {
      title: "Resumo",
      message: "Mensagem",
      action: "Ação",
    },
    holistic: {
      overallScore: 35,
      level: "MEDIUM",
      recommendation: "REVIEW",
      ensembleConfidence: 82,
      dimensions: {
        binRisk: { score: 40, weight: 30, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
        temporalRisk: { score: 30, weight: 10, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
        behavioralRisk: { score: 35, weight: 15, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
        geographicRisk: { score: 30, weight: 20, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
        deviceRisk: { score: 30, weight: 10, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
        gatewayRisk: { score: 30, weight: 15, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      },
    },
    peerComparison: {
      percentile: 65,
      description: "abaixo de 65% dos cartões similares",
      similarCount: 240,
      cohortKey: "BR-CREDIT-GOLD",
    },
    ...overrides,
  }
}

describe("mapFullBinAnalysisToResponse", () => {
  it("mapeia payload completo para AnalysisResponse", () => {
    const result = mapFullBinAnalysisToResponse(makeAnalysis())

    expect(result.binAnalysis.bin).toBe("405708")
    expect(result.binAnalysis.binData.issuingNetwork).toBe("VISA")
    expect(result.binAnalysis.binData.productType).toBe("CREDIT")
    expect(result.binAnalysis.recommendations.length).toBeGreaterThan(0)
    expect(result.threeDSAnalysis.recommendedFlow).toBe("FRICTIONLESS")
    expect(result.riskAnalysis.overallRiskScore).toBe(42)
    expect(result.riskAnalysis.recommendations.action).toBe("REVIEW")
  })

  it("aplica valores default quando campos opcionais ausentes", () => {
    const result = mapFullBinAnalysisToResponse(
      makeAnalysis({
        technicalData: {
          bin: "405708",
          binLength: 6,
          source: "INTERNAL",
        },
        threeDSAnalysis: {
          status: "UNKNOWN",
          confidence: "LOW",
          challengeLikelihood: "UNKNOWN",
          protocolLikely: "UNKNOWN",
          authMethodsLikely: [],
          explanation: "",
          inferred: true,
          frictionlessProbability: 50,
          challengeProbability: 50,
          bypassProbability: 20,
          applicableBypassMechanisms: [],
        },
      }),
    )

    expect(result.riskAnalysis.riskFactors).toEqual({
      binRisk: 40,
      temporalRisk: 30,
      behavioralRisk: 35,
      geographicRisk: 30,
      deviceRisk: 30,
      gatewayRisk: 30,
    })
    expect(result.riskAnalysis.alerts).toEqual([])
    expect(result.binAnalysis.binData.issuerName).toBe("Emissor não informado")
  })
})
