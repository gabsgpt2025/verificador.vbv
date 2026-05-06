// lib/bin/calculateRisk.ts
// Score de risco explicável — score inicial 30, ajustado por fatores

import type { BinApiData, ThreeDSAnalysis, RiskAnalysis, RiskFactor } from "./types"
import { getCountryMaturity } from "./country3dsMaturity"

export function calculateRisk(
  binData: BinApiData,
  threeDSAnalysis: ThreeDSAnalysis,
): RiskAnalysis {
  let score = 30
  const factors: RiskFactor[] = []

  // Emissor ausente
  if (!binData.issuer) {
    score += 15
    factors.push({
      label: "Emissor não identificado",
      impact: 15,
      reason: "A API não retornou dados do emissor. Emissores desconhecidos aumentam incerteza.",
    })
  }

  // País ausente
  if (!binData.countryCode) {
    score += 15
    factors.push({
      label: "País de emissão desconhecido",
      impact: 15,
      reason: "Sem informação de país, não é possível avaliar maturidade 3DS ou compliance regional.",
    })
  } else {
    const maturity = getCountryMaturity(binData.countryCode)
    if (maturity?.maturity === "HIGH") {
      score -= 10
      factors.push({
        label: "País com alta maturidade 3DS",
        impact: -10,
        reason: `${binData.countryCode}: ${maturity.note}`,
      })
    } else if (maturity?.maturity === "LOW") {
      score += 15
      factors.push({
        label: "País com baixa maturidade 3DS",
        impact: 15,
        reason: `${binData.countryCode}: ${maturity.note}`,
      })
    }
  }

  // Pré-pago
  if (binData.isPrepaid === true) {
    score += 20
    factors.push({
      label: "Cartão pré-pago",
      impact: 20,
      reason: "Cartões pré-pagos têm maior risco de fraude e menor suporte a 3DS.",
    })
  }

  // Tipo desconhecido
  if (!binData.type) {
    score += 10
    factors.push({
      label: "Tipo de cartão desconhecido",
      impact: 10,
      reason: "Sem informação de tipo (crédito/débito/pré-pago), a análise fica incompleta.",
    })
  }

  // Categoria desconhecida
  if (!binData.category) {
    score += 10
    factors.push({
      label: "Categoria do cartão não informada",
      impact: 10,
      reason: "Categoria ausente reduz a capacidade de inferência sobre nível de suporte 3DS.",
    })
  }

  // 3DS inferido inativo
  if (threeDSAnalysis.status === "LIKELY_INACTIVE") {
    score += 25
    factors.push({
      label: "3DS provavelmente inativo (inferido)",
      impact: 25,
      reason: "Análise interna sugere baixa probabilidade de suporte 3DS/VBV nesta BIN.",
    })
  } else if (threeDSAnalysis.status === "UNKNOWN") {
    score += 10
    factors.push({
      label: "Status 3DS não determinado",
      impact: 10,
      reason: "Dados insuficientes para inferir status 3DS. Recomenda-se cautela.",
    })
  } else if (threeDSAnalysis.status === "LIKELY_ACTIVE" || threeDSAnalysis.status === "CONFIRMED_ACTIVE") {
    score -= 10
    factors.push({
      label: "3DS provavelmente ativo (inferido)",
      impact: -10,
      reason: "Análise interna sugere suporte provável a autenticação 3DS/VBV.",
    })
  }

  // Dados completos com banco conhecido
  if (binData.issuer && binData.countryCode && binData.brand && binData.type && binData.category) {
    score -= 10
    factors.push({
      label: "Dados completos com emissor identificado",
      impact: -10,
      reason: "BIN com dados completos e emissor conhecido apresenta menor incerteza.",
    })
  }

  // Comercial/PJ
  if (binData.isCommercial === true) {
    score += 5
    factors.push({
      label: "Cartão comercial/empresarial (PJ)",
      impact: 5,
      reason: "Cartões comerciais exigem análise contextual adicional.",
    })
  }

  // BIN 8 dígitos (mais preciso)
  if (binData.binLength >= 8) {
    score -= 5
    factors.push({
      label: "BIN de 8 dígitos (maior precisão)",
      impact: -5,
      reason: "BINs de 8 dígitos permitem identificação mais precisa do emissor e produto.",
    })
  }

  // Clamp score
  score = Math.min(Math.max(score, 0), 100)

  const level = getRiskLevel(score)
  const recommendation = getRecommendation(score, binData)

  return { score, level, recommendation, factors }
}

function getRiskLevel(score: number): RiskAnalysis["level"] {
  if (score >= 81) return "CRITICAL"
  if (score >= 61) return "HIGH"
  if (score >= 31) return "MEDIUM"
  return "LOW"
}

function getRecommendation(score: number, binData: BinApiData): RiskAnalysis["recommendation"] {
  // Dados muito incompletos
  const hasMinimalData = binData.brand || binData.countryCode || binData.issuer
  if (!hasMinimalData) return "INSUFFICIENT_DATA"

  if (score >= 81) return "BLOCK_PREVENTIVELY"
  if (score >= 61) return "REQUIRE_3DS"
  if (score >= 31) return "REVIEW"
  return "ALLOW_WITH_MONITORING"
}
