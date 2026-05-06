// VeriFiBIN 2.0 — Explainable Risk Score Engine
// Pure, testable rule pipeline. Each rule returns a breakdown item.
// Score range: 0–100. Higher = more risk.

import type { RiskAnalysis, RiskBreakdownItem, RiskLevel, RecommendationCode } from "./types"
import { getCountryMaturity } from "./countryMaturity"

export interface RiskEngineInput {
  bin: string
  binLength: 6 | 8
  brand: string | null
  cardType: string | null
  cardCategory: string | null
  countryCode: string | null
  issuer: string | null
  isPrepaid: boolean
  isCommercial: boolean
  dataCompleteness: number // 0–100
  conflictingDataDetected: boolean
}

// ─── Individual Risk Rules ─────────────────────────────────────────────────
// Each rule is a pure function returning a RiskBreakdownItem with a numeric impact

function ruleCountryMaturity(input: RiskEngineInput): RiskBreakdownItem {
  const config = getCountryMaturity(input.countryCode ?? "")

  switch (config.maturity) {
    case "ALTA":
      return { factor: `País ${config.name} com alta maturidade 3DS`, impact: "-5", numericImpact: -5 }
    case "MEDIA":
      return { factor: `País ${config.name} com maturidade 3DS média`, impact: "+10", numericImpact: 10 }
    case "BAIXA":
      return { factor: `País ${config.name} com baixa maturidade 3DS`, impact: "+25", numericImpact: 25 }
    case "VARIAVEL":
      return { factor: `País ${config.name} com maturidade 3DS variável`, impact: "+15", numericImpact: 15 }
    default:
      return { factor: "País de emissão não identificado", impact: "+20", numericImpact: 20 }
  }
}

function rulePrepaid(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isPrepaid) return null
  return { factor: "Cartão pré-pago — maior risco antifraude", impact: "+20", numericImpact: 20 }
}

function ruleCommercial(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isCommercial) return null
  return { factor: "Cartão comercial/PJ — regras de análise diferenciadas", impact: "+5", numericImpact: 5 }
}

function ruleCardType(input: RiskEngineInput): RiskBreakdownItem {
  const t = (input.cardType ?? "").toUpperCase()
  if (t.includes("CREDIT")) {
    return { factor: "Cartão de crédito — padrão", impact: "-5", numericImpact: -5 }
  }
  if (t.includes("DEBIT")) {
    return { factor: "Cartão de débito", impact: "+0", numericImpact: 0 }
  }
  if (t.includes("PREPAID")) {
    return { factor: "Cartão pré-pago (tipo)", impact: "+15", numericImpact: 15 }
  }
  return { factor: "Tipo de cartão não identificado", impact: "+10", numericImpact: 10 }
}

function ruleCardCategory(input: RiskEngineInput): RiskBreakdownItem {
  const c = (input.cardCategory ?? "").toUpperCase()

  if (["INFINITE", "BLACK", "WORLD ELITE", "SIGNATURE"].some((v) => c.includes(v))) {
    return { factor: `Cartão ${input.cardCategory ?? "premium"} — categoria premium`, impact: "-10", numericImpact: -10 }
  }
  if (c.includes("PLATINUM")) {
    return { factor: "Cartão Platinum — alta categoria", impact: "-5", numericImpact: -5 }
  }
  if (c.includes("GOLD")) {
    return { factor: "Cartão Gold", impact: "-3", numericImpact: -3 }
  }
  if (c.includes("CLASSIC") || c.includes("STANDARD")) {
    return { factor: "Cartão Classic/Standard — categoria básica", impact: "+5", numericImpact: 5 }
  }
  if (!input.cardCategory) {
    return { factor: "Categoria do cartão não identificada", impact: "+10", numericImpact: 10 }
  }
  return { factor: `Categoria ${input.cardCategory}`, impact: "+0", numericImpact: 0 }
}

function ruleIssuerKnown(input: RiskEngineInput): RiskBreakdownItem {
  if (!input.issuer) {
    return { factor: "Emissor não identificado pela API", impact: "+15", numericImpact: 15 }
  }

  // Known major banks (risk reduction)
  const knownBanks = [
    "CHASE", "WELLS FARGO", "BANK OF AMERICA", "CITIBANK",
    "HSBC", "BARCLAYS", "SANTANDER", "ITAU", "BRADESCO",
    "NUBANK", "INTER", "DEUTSCHE BANK", "BNP PARIBAS",
    "CREDIT AGRICOLE", "NATWEST", "LLOYDS", "HALIFAX",
  ]
  const issuerUpper = input.issuer.toUpperCase()
  if (knownBanks.some((b) => issuerUpper.includes(b))) {
    return { factor: `Banco emissor conhecido: ${input.issuer}`, impact: "-10", numericImpact: -10 }
  }

  return { factor: `Emissor identificado: ${input.issuer}`, impact: "+0", numericImpact: 0 }
}

function ruleBrand(input: RiskEngineInput): RiskBreakdownItem {
  const b = (input.brand ?? "").toUpperCase()
  if (["VISA", "MASTERCARD"].some((v) => b.includes(v))) {
    return { factor: `Cartão ${input.brand} — bandeira principal`, impact: "-5", numericImpact: -5 }
  }
  if (b.includes("AMEX") || b.includes("AMERICAN EXPRESS")) {
    return { factor: "Cartão American Express — suporte 3DS robusto", impact: "-5", numericImpact: -5 }
  }
  if (!input.brand) {
    return { factor: "Bandeira não identificada", impact: "+10", numericImpact: 10 }
  }
  return { factor: `Bandeira ${input.brand}`, impact: "+0", numericImpact: 0 }
}

function ruleDataCompleteness(input: RiskEngineInput): RiskBreakdownItem {
  if (input.dataCompleteness >= 90) {
    return { factor: "Dados completos da API", impact: "-5", numericImpact: -5 }
  }
  if (input.dataCompleteness >= 70) {
    return { factor: "Dados parcialmente completos", impact: "+5", numericImpact: 5 }
  }
  if (input.dataCompleteness >= 40) {
    return { factor: "Dados incompletos da API", impact: "+10", numericImpact: 10 }
  }
  return { factor: "Dados muito incompletos — análise comprometida", impact: "+20", numericImpact: 20 }
}

function ruleConflictingData(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.conflictingDataDetected) return null
  return { factor: "Dados inconsistentes detectados entre campos", impact: "+15", numericImpact: 15 }
}

function ruleBinLength(input: RiskEngineInput): RiskBreakdownItem | null {
  if (input.binLength === 8) {
    return { factor: "BIN de 8 dígitos — maior precisão de identificação", impact: "-5", numericImpact: -5 }
  }
  return null
}

// ─── Risk Level from Score ─────────────────────────────────────────────────

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 81) return "CRITICO"
  if (score >= 61) return "ALTO"
  if (score >= 31) return "MEDIO"
  return "BAIXO"
}

// ─── Recommendation from Score + Input ────────────────────────────────────

function deriveRecommendation(
  score: number,
  input: RiskEngineInput,
): RecommendationCode {
  if (input.dataCompleteness < 40) return "DADOS_INSUFICIENTES"

  const level = getRiskLevel(score)

  if (level === "CRITICO") return "BLOQUEAR_PREVENTIVAMENTE"
  if (level === "ALTO") return "EXIGIR_3DS"
  if (level === "MEDIO") return "REVISAR"
  return "APROVAR_COM_SEGURANCA"
}

// ─── Main Engine ───────────────────────────────────────────────────────────

export function calculateRiskScore(input: RiskEngineInput): RiskAnalysis {
  const BASE_SCORE = 20 // baseline risk

  const ruleResults = [
    ruleCountryMaturity(input),
    rulePrepaid(input),
    ruleCommercial(input),
    ruleCardType(input),
    ruleCardCategory(input),
    ruleIssuerKnown(input),
    ruleBrand(input),
    ruleDataCompleteness(input),
    ruleConflictingData(input),
    ruleBinLength(input),
  ].filter((r): r is RiskBreakdownItem => r !== null)

  const totalImpact = ruleResults.reduce((sum, r) => sum + r.numericImpact, 0)
  const rawScore = BASE_SCORE + totalImpact
  const score = Math.min(Math.max(rawScore, 0), 100)

  const level = getRiskLevel(score)
  const recommendation = deriveRecommendation(score, input)

  return {
    score,
    level,
    recommendation,
    riskBreakdown: ruleResults,
  }
}
