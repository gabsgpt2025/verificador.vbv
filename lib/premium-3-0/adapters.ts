import type { AnalysisResponse, FullBinAnalysis } from "@/lib/premium-3-0/types"

type Likelihood = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"

function mapBrandToIssuingNetwork(brand?: string): "MASTERCARD" | "VISA" | "AMEX" | "OTHER" {
  const normalized = (brand ?? "").toUpperCase()
  if (normalized.includes("MASTERCARD")) return "MASTERCARD"
  if (normalized.includes("VISA")) return "VISA"
  if (normalized.includes("AMEX") || normalized.includes("AMERICAN EXPRESS")) return "AMEX"
  return "OTHER"
}

function mapCategoryToCardLevel(category?: string): "STANDARD" | "GOLD" | "PLATINUM" | "BLACK" | "UNKNOWN" {
  const normalized = (category ?? "").toUpperCase()
  if (normalized.includes("BLACK") || normalized.includes("INFINITE") || normalized.includes("WORLD ELITE"))
    return "BLACK"
  if (normalized.includes("PLATINUM")) return "PLATINUM"
  if (normalized.includes("GOLD")) return "GOLD"
  if (normalized.includes("STANDARD") || normalized.includes("CLASSIC")) return "STANDARD"
  return "UNKNOWN"
}

function mapProductType(type?: string): "CREDIT" | "DEBIT" | "PREPAID" | "UNKNOWN" {
  const normalized = (type ?? "").toUpperCase()
  if (normalized === "CREDIT" || normalized === "DEBIT" || normalized === "PREPAID") return normalized
  return "UNKNOWN"
}

function mapChallengeLikelihood(likelihood?: string): Likelihood {
  if (likelihood === "HIGH") return "HIGH"
  if (likelihood === "MEDIUM") return "MEDIUM"
  if (likelihood === "LOW") return "LOW"
  return "MEDIUM"
}

function mapFrictionlessLikelihood(threeDS: FullBinAnalysis["threeDSAnalysis"]): Likelihood {
  if (threeDS.status === "CONFIRMED_ACTIVE") return "VERY_HIGH"
  if (threeDS.status === "CONFIRMED_INACTIVE") return "VERY_LOW"

  if (threeDS.challengeLikelihood === "LOW") return "HIGH"
  if (threeDS.challengeLikelihood === "HIGH") return "LOW"
  return "MEDIUM"
}

function mapRecommendedFlow(challengeLikelihood: Likelihood, frictionlessLikelihood: Likelihood): "FRICTIONLESS" | "CHALLENGE" | "HYBRID" {
  if (challengeLikelihood === "VERY_HIGH" || challengeLikelihood === "HIGH") return "CHALLENGE"
  if (frictionlessLikelihood === "VERY_HIGH" || frictionlessLikelihood === "HIGH") return "FRICTIONLESS"
  return "HYBRID"
}

function mapEstimatedSuccessRate(
  frictionlessLikelihood: Likelihood,
  challengeLikelihood: Likelihood,
  confidence?: "LOW" | "MEDIUM" | "HIGH",
): number {
  const frictionlessBase: Record<Likelihood, number> = {
    VERY_LOW: 45,
    LOW: 60,
    MEDIUM: 75,
    HIGH: 88,
    VERY_HIGH: 94,
  }
  const challengePenalty: Record<Likelihood, number> = {
    VERY_LOW: 0,
    LOW: 3,
    MEDIUM: 8,
    HIGH: 15,
    VERY_HIGH: 20,
  }
  const confidenceBoost = confidence === "HIGH" ? 3 : confidence === "LOW" ? -3 : 0
  const raw = frictionlessBase[frictionlessLikelihood] - challengePenalty[challengeLikelihood] + confidenceBoost
  return Math.min(99, Math.max(35, raw))
}

function mapRecommendationAction(
  recommendation?: FullBinAnalysis["riskAnalysis"]["recommendation"],
): "APPROVE" | "CHALLENGE" | "DECLINE" | "REVIEW" {
  if (recommendation === "ALLOW_WITH_MONITORING") return "APPROVE"
  if (recommendation === "REQUIRE_3DS") return "CHALLENGE"
  if (recommendation === "BLOCK_PREVENTIVELY") return "DECLINE"
  return "REVIEW"
}

function mapRecommendationConfidence(level?: FullBinAnalysis["riskAnalysis"]["level"]): number {
  if (level === "LOW") return 95
  if (level === "MEDIUM") return 85
  if (level === "HIGH") return 75
  if (level === "CRITICAL") return 65
  return 70
}

function mapBypassMechanism(
  recommendedFlow: "FRICTIONLESS" | "CHALLENGE" | "HYBRID",
  frictionlessLikelihood: Likelihood,
): "NONE" | "FRICTIONLESS_3DS2" | "SCA_EXEMPTION" | "3DS_NOMINAL" | "UNKNOWN" {
  if (recommendedFlow === "CHALLENGE") return "3DS_NOMINAL"
  if (frictionlessLikelihood === "VERY_HIGH") return "SCA_EXEMPTION"
  if (recommendedFlow === "FRICTIONLESS") return "FRICTIONLESS_3DS2"
  if (recommendedFlow === "HYBRID") return "NONE"
  return "UNKNOWN"
}

export function mapFullBinAnalysisToResponse(apiData: FullBinAnalysis): AnalysisResponse {
  const now = new Date().toISOString()
  const challengeLikelihood = mapChallengeLikelihood(apiData?.threeDSAnalysis?.challengeLikelihood)
  const frictionlessLikelihood = mapFrictionlessLikelihood(apiData?.threeDSAnalysis)
  const recommendedFlow = mapRecommendedFlow(challengeLikelihood, frictionlessLikelihood)
  const estimatedSuccessRate = mapEstimatedSuccessRate(
    frictionlessLikelihood,
    challengeLikelihood,
    apiData?.threeDSAnalysis?.confidence,
  )
  const recommendationAction = mapRecommendationAction(apiData?.riskAnalysis?.recommendation)

  return {
    requestId: `req_${Date.now()}`,
    timestamp: now,
    binAnalysis: {
      bin: apiData?.bin ?? "",
      binData: {
        bin: apiData?.bin ?? "",
        country: apiData?.technicalData?.countryName ?? apiData?.technicalData?.countryCode ?? "UNKNOWN",
        issuerName: apiData?.technicalData?.issuer ?? "Emissor não informado",
        productType: mapProductType(apiData?.technicalData?.type),
        cardLevel: mapCategoryToCardLevel(apiData?.technicalData?.category),
        isReloadable: apiData?.technicalData?.isPrepaid ?? false,
        issuingNetwork: mapBrandToIssuingNetwork(apiData?.technicalData?.brand),
        lastUpdated: now,
      },
      riskScore: apiData?.riskAnalysis?.score ?? 0,
      riskLevel: apiData?.riskAnalysis?.level ?? "MEDIUM",
      frictionlessLikelihood,
      bypassMechanism: mapBypassMechanism(recommendedFlow, frictionlessLikelihood),
      alerts: [],
      recommendations: [
        apiData?.finalSummary?.title,
        apiData?.finalSummary?.message,
        apiData?.finalSummary?.action,
      ].filter((item): item is string => Boolean(item)),
    },
    threeDSAnalysis: {
      frictionlessLikelihood,
      challengeLikelihood,
      recommendedFlow,
      estimatedSuccessRate,
      explanation: {
        technical: apiData?.threeDSAnalysis?.explanation ?? "Análise técnica indisponível.",
        popular:
          recommendedFlow === "CHALLENGE"
            ? "Esta transação deve pedir uma verificação adicional para aumentar a segurança."
            : recommendedFlow === "FRICTIONLESS"
              ? "Esta transação tem alta chance de seguir sem desafio adicional."
              : "Esta transação pode alternar entre fluxo sem desafio e verificação adicional.",
      },
    },
    riskAnalysis: {
      overallRiskScore: apiData?.riskAnalysis?.score ?? 0,
      riskLevel: apiData?.riskAnalysis?.level ?? "MEDIUM",
      riskFactors: {
        binRisk: apiData?.riskAnalysis?.score ?? 0,
        temporalRisk: 0,
        behavioralRisk: 0,
        geographicRisk: 0,
        deviceRisk: 0,
        gatewayRisk: 0,
      },
      alerts: [],
      recommendations: {
        action: recommendationAction,
        confidence: mapRecommendationConfidence(apiData?.riskAnalysis?.level),
        reasoning: {
          technical: apiData?.finalSummary?.message ?? "Recomendação gerada a partir da análise de risco.",
          popular: apiData?.finalSummary?.action ?? "Use esta análise para tomar a decisão com segurança.",
        },
      },
    },
    languageMode: {
      mode: "TECHNICAL",
      label: "🔧 Modo Técnico",
      description: "Linguagem especializada para profissionais de segurança",
    },
  }
}
