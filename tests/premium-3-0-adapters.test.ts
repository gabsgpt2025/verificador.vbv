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
      explanation: {
        technical: "Análise inferida",
        popular: "Análise inferida",
      },
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
    // HolisticScore: dimensões ficam DIRETAMENTE no objeto raiz (sem .dimensions)
    holistic: {
      overallScore: 35,
      riskLevel: "MEDIUM",
      recommendation: "REVIEW",
      ensembleConfidence: 82,
      sourcesUsed: ["INTERNAL"],
      peerComparison: { percentile: 65, description: "melhor que 65% dos cartões" },
      binRisk: { score: 40, weight: 0.3, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      temporalRisk: { score: 30, weight: 0.1, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      behavioralRisk: { score: 35, weight: 0.15, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      geographicRisk: { score: 30, weight: 0.2, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      deviceRisk: { score: 30, weight: 0.15, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
      gatewayRisk: { score: 30, weight: 0.1, factors: [], explanation: { technical: "t", popular: "p" }, dataAvailable: true },
    },
    peerComparison: {
      percentile: 65,
      description: "melhor que 65% dos cartões similares",
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
    // overallRiskScore agora usa holistic.overallScore (35) em vez de riskAnalysis.score (42)
    expect(result.riskAnalysis.overallRiskScore).toBe(35)
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
          explanation: {
            technical: "",
            popular: "",
          },
          inferred: true,
          frictionlessProbability: 50,
          challengeProbability: 50,
          bypassProbability: 20,
          applicableBypassMechanisms: [],
        },
      }),
    )

    // Com holistic presente (do makeAnalysis base), riskFactors vêm de holistic.*.score
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

  it("usa riskAnalysis.score como fallback quando holistic ausente", () => {
    const result = mapFullBinAnalysisToResponse(
      makeAnalysis({ holistic: undefined }),
    )

    // Sem holistic, overallRiskScore cai para riskAnalysis.score (42)
    expect(result.riskAnalysis.overallRiskScore).toBe(42)
    // riskFactors.binRisk cai para riskAnalysis.score (42) como fallback
    expect(result.riskAnalysis.riskFactors.binRisk).toBe(42)
    // Outros fatores ficam 0 sem holistic
    expect(result.riskAnalysis.riskFactors.temporalRisk).toBe(0)
    expect(result.riskAnalysis.riskFactors.geographicRisk).toBe(0)
  })
})
