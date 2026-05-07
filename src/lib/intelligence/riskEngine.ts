// VeriFiBIN 2.0 — Explainable Risk Score Engine (Enhanced)
// Pure, testable rule pipeline. Each rule returns a breakdown item.
// Score range: 0–100. Higher = more risk.
// Enhanced with: issuer intelligence, bypass mechanisms, temporal risk, gateway risk, behavioral biometrics

import type { RiskAnalysis, RiskBreakdownItem, RiskLevel, RecommendationCode } from "./types"
import { getCountryMaturity } from "./countryMaturity"
import {
  findIssuerByBinPrefix,
  findIssuerByName,
  getBypassMechanismDescription,
  type IssuerProfile,
} from "./issuerIntelligence"
import { calculateAlertRiskImpact, generateFraudAlerts } from "./fraudAlerts"
import type { ThreeDSAnalysis } from "./types"

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
  // Optional enrichment fields
  transactionHour?: number       // 0–23 (UTC-3)
  transactionDayOfWeek?: number  // 0=Sunday, 6=Saturday
  isHoliday?: boolean
  transactionAmount?: number     // in BRL
  merchantMCC?: string           // Merchant Category Code
  attemptCount?: number          // number of attempts for this card
  isNewCard?: boolean            // card issued < 72h ago
  isDependentCard?: boolean      // additional/dependent card
  isVirtualCard?: boolean        // virtual card
  ipCountryCode?: string         // country of the transaction IP
}

// ─── Individual Risk Rules ─────────────────────────────────────────────────
// Each rule is a pure function returning a RiskBreakdownItem with a numeric impact

function ruleCountryMaturity(input: RiskEngineInput): RiskBreakdownItem {
  const config = getCountryMaturity(input.countryCode ?? "")

  switch (config.maturity) {
    case "ALTA":
      return { factor: `País ${config.name} com alta maturidade 3DS (${config.regulatoryFramework})`, impact: "-5", numericImpact: -5 }
    case "MEDIA":
      return { factor: `País ${config.name} com maturidade 3DS média`, impact: "+10", numericImpact: 10 }
    case "BAIXA":
      return { factor: `País ${config.name} com baixa maturidade 3DS — infraestrutura limitada`, impact: "+25", numericImpact: 25 }
    case "VARIAVEL":
      return { factor: `País ${config.name} com maturidade 3DS variável por emissor`, impact: "+15", numericImpact: 15 }
    default:
      return { factor: "País de emissão não identificado na base de dados", impact: "+20", numericImpact: 20 }
  }
}

function rulePrepaid(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isPrepaid) return null
  return { factor: "Cartão pré-pago — maior risco antifraude, sem vínculo bancário forte", impact: "+20", numericImpact: 20 }
}

function ruleCommercial(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isCommercial) return null
  // Commercial cards have higher bypass probability via B2B exemption
  return {
    factor: "Cartão comercial/PJ — alta probabilidade de isenção SCA B2B e bypass de 3DS",
    impact: "+20",
    numericImpact: 20,
  }
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
    return { factor: "Cartão pré-pago (tipo declarado)", impact: "+15", numericImpact: 15 }
  }
  return { factor: "Tipo de cartão não identificado", impact: "+10", numericImpact: 10 }
}

function ruleCardCategory(input: RiskEngineInput): RiskBreakdownItem {
  const c = (input.cardCategory ?? "").toUpperCase()

  if (["INFINITE", "BLACK", "WORLD ELITE", "SIGNATURE"].some((v) => c.includes(v))) {
    return { factor: `Cartão ${input.cardCategory ?? "premium"} — categoria premium, portador de alto valor`, impact: "-10", numericImpact: -10 }
  }
  if (c.includes("PLATINUM")) {
    return { factor: "Cartão Platinum — alta categoria", impact: "-5", numericImpact: -5 }
  }
  if (c.includes("GOLD")) {
    return { factor: "Cartão Gold", impact: "-3", numericImpact: -3 }
  }
  if (c.includes("BUSINESS") || c.includes("CORPORATE") || c.includes("EMPRESARIAL")) {
    return { factor: "Cartão Business/Corporate — isenção B2B aplicável, bypass provável", impact: "+15", numericImpact: 15 }
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
    return { factor: "Emissor não identificado pela API — análise limitada", impact: "+15", numericImpact: 15 }
  }

  // Known major banks (risk reduction)
  const knownBanks = [
    "CHASE", "WELLS FARGO", "BANK OF AMERICA", "CITIBANK",
    "HSBC", "BARCLAYS", "SANTANDER", "ITAU", "BRADESCO",
    "NUBANK", "INTER", "DEUTSCHE BANK", "BNP PARIBAS",
    "CREDIT AGRICOLE", "NATWEST", "LLOYDS", "HALIFAX",
    "CAIXA", "BANCO DO BRASIL", "SICREDI", "SICOOB",
  ]
  const issuerUpper = input.issuer.toUpperCase()
  if (knownBanks.some((b) => issuerUpper.includes(b))) {
    return { factor: `Banco emissor conhecido: ${input.issuer}`, impact: "-10", numericImpact: -10 }
  }

  // High-risk issuers (known for fraud or weak 3DS)
  const highRiskIssuers = [
    "ADVCASH", "NETSPEND", "GREEN DOT", "PAYONEER", "QONTO",
    "SUPERDIGITAL", "CHIME", "CURRENT",
  ]
  if (highRiskIssuers.some((b) => issuerUpper.includes(b))) {
    return { factor: `Emissor com histórico de 3DS fraco: ${input.issuer}`, impact: "+20", numericImpact: 20 }
  }

  return { factor: `Emissor identificado: ${input.issuer}`, impact: "+0", numericImpact: 0 }
}

function ruleBrand(input: RiskEngineInput): RiskBreakdownItem {
  const b = (input.brand ?? "").toUpperCase()
  if (["VISA", "MASTERCARD"].some((v) => b.includes(v))) {
    return { factor: `Cartão ${input.brand} — bandeira principal com suporte 3DS`, impact: "-5", numericImpact: -5 }
  }
  if (b.includes("AMEX") || b.includes("AMERICAN EXPRESS")) {
    return { factor: "Cartão American Express — suporte 3DS robusto (SafeKey)", impact: "-5", numericImpact: -5 }
  }
  if (b.includes("ELO")) {
    return { factor: "Cartão Elo — bandeira nacional brasileira com 3DS", impact: "-3", numericImpact: -3 }
  }
  if (!input.brand) {
    return { factor: "Bandeira não identificada", impact: "+10", numericImpact: 10 }
  }
  return { factor: `Bandeira ${input.brand}`, impact: "+0", numericImpact: 0 }
}

function ruleDataCompleteness(input: RiskEngineInput): RiskBreakdownItem {
  if (input.dataCompleteness >= 90) {
    return { factor: "Dados completos da API — análise de alta confiança", impact: "-5", numericImpact: -5 }
  }
  if (input.dataCompleteness >= 70) {
    return { factor: "Dados parcialmente completos", impact: "+5", numericImpact: 5 }
  }
  if (input.dataCompleteness >= 40) {
    return { factor: "Dados incompletos da API — análise comprometida", impact: "+10", numericImpact: 10 }
  }
  return { factor: "Dados muito incompletos — análise de baixa confiança", impact: "+20", numericImpact: 20 }
}

function ruleConflictingData(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.conflictingDataDetected) return null
  return { factor: "Dados inconsistentes detectados entre campos da API", impact: "+15", numericImpact: 15 }
}

function ruleBinLength(input: RiskEngineInput): RiskBreakdownItem | null {
  if (input.binLength === 8) {
    return { factor: "BIN de 8 dígitos — maior precisão de identificação do emissor", impact: "-5", numericImpact: -5 }
  }
  return null
}

// ─── NEW RULES: Temporal Risk ──────────────────────────────────────────────

function ruleTemporalRisk(input: RiskEngineInput): RiskBreakdownItem | null {
  const hour = input.transactionHour
  const dow = input.transactionDayOfWeek

  if (hour === undefined && dow === undefined) return null

  // High-risk windows: 1am-5am (reduced monitoring), Sunday nights, holidays
  const isLateNight = hour !== undefined && (hour >= 1 && hour <= 5)
  const isSundayNight = dow === 0 && hour !== undefined && hour >= 20
  const isHoliday = input.isHoliday === true

  if (isLateNight) {
    return {
      factor: "Transação em horário de madrugada (01h-05h) — janela de menor monitoramento",
      impact: "+15",
      numericImpact: 15,
    }
  }
  if (isSundayNight) {
    return {
      factor: "Transação domingo à noite — janela de menor rigor em alguns emissores",
      impact: "+10",
      numericImpact: 10,
    }
  }
  if (isHoliday) {
    return {
      factor: "Transação em feriado — equipes de monitoramento reduzidas",
      impact: "+10",
      numericImpact: 10,
    }
  }
  return null
}

// ─── NEW RULES: Low Value Exemption Risk ──────────────────────────────────

function ruleLowValueExemption(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.transactionAmount) return null

  // SCA Low-Value Exemption threshold: ~R$150 (€30 equivalent)
  if (input.transactionAmount <= 150) {
    return {
      factor: `Valor R$${input.transactionAmount} abaixo do limiar de isenção SCA (R$150) — 3DS pode ser suprimido`,
      impact: "+10",
      numericImpact: 10,
    }
  }
  if (input.transactionAmount <= 1) {
    return {
      factor: "Valor de R$1 ou menos — possível transação de teste/validação de cartão",
      impact: "+25",
      numericImpact: 25,
    }
  }
  return null
}

// ─── NEW RULES: MCC Risk ──────────────────────────────────────────────────

function ruleMCCRisk(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.merchantMCC) return null

  // High-risk MCCs for fraud
  const highRiskMCCs: Record<string, string> = {
    "6051": "Quasi-Cash / Criptomoedas",
    "6211": "Corretoras de Valores",
    "7995": "Apostas e Jogos de Azar",
    "5816": "Jogos Digitais",
    "5817": "Aplicativos Digitais",
    "5818": "Bens Digitais",
    "4816": "Serviços de Internet",
    "6012": "Serviços Financeiros",
    "7372": "Software",
  }

  const mccDescription = highRiskMCCs[input.merchantMCC]
  if (mccDescription) {
    return {
      factor: `MCC ${input.merchantMCC} (${mccDescription}) — categoria de alto risco para fraude`,
      impact: "+15",
      numericImpact: 15,
    }
  }
  return null
}

// ─── NEW RULES: Multiple Attempts ─────────────────────────────────────────

function ruleMultipleAttempts(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.attemptCount || input.attemptCount <= 1) return null

  if (input.attemptCount >= 3) {
    return {
      factor: `${input.attemptCount} tentativas detectadas — possível ataque de brute force ou teste de cartão`,
      impact: "+35",
      numericImpact: 35,
    }
  }
  if (input.attemptCount === 2) {
    return {
      factor: "2ª tentativa de pagamento — monitorar padrão",
      impact: "+15",
      numericImpact: 15,
    }
  }
  return null
}

// ─── NEW RULES: New Card Risk ─────────────────────────────────────────────

function ruleNewCard(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isNewCard) return null
  return {
    factor: "Cartão recém-emitido (< 72h) — 3DS pode não estar completamente ativo",
    impact: "+20",
    numericImpact: 20,
  }
}

// ─── NEW RULES: Virtual Card ──────────────────────────────────────────────

function ruleVirtualCard(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.isVirtualCard) return null
  return {
    factor: "Cartão virtual — maior risco de geração por algoritmos (BIN-gen)",
    impact: "+10",
    numericImpact: 10,
  }
}

// ─── NEW RULES: IP Country Mismatch ──────────────────────────────────────

function ruleIPCountryMismatch(input: RiskEngineInput): RiskBreakdownItem | null {
  if (!input.ipCountryCode || !input.countryCode) return null
  if (input.ipCountryCode.toUpperCase() === input.countryCode.toUpperCase()) return null

  return {
    factor: `IP de ${input.ipCountryCode} diferente do país do BIN (${input.countryCode}) — possível VPN ou fraude cross-border`,
    impact: "+20",
    numericImpact: 20,
  }
}

// ─── NEW RULES: Issuer Intelligence ──────────────────────────────────────

function ruleIssuerIntelligence(input: RiskEngineInput): RiskBreakdownItem | null {
  const issuerProfile = findIssuerByBinPrefix(input.bin) ?? findIssuerByName(input.issuer ?? "")
  if (!issuerProfile) return null

  const bypassDesc = getBypassMechanismDescription(issuerProfile.bypassMechanism)

  // Calculate risk based on frictionless likelihood
  const frictionlessImpact: Record<string, number> = {
    MUITO_ALTA: 30,
    ALTA: 20,
    MEDIA: 10,
    BAIXA: 0,
    MUITO_BAIXA: -5,
  }

  const impact = frictionlessImpact[issuerProfile.frictionlessLikelihood] ?? 0

  if (impact === 0) return null

  return {
    factor: `Emissor ${issuerProfile.name}: ${bypassDesc}`,
    impact: impact > 0 ? `+${impact}` : `${impact}`,
    numericImpact: impact,
  }
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
    // New rules
    ruleTemporalRisk(input),
    ruleLowValueExemption(input),
    ruleMCCRisk(input),
    ruleMultipleAttempts(input),
    ruleNewCard(input),
    ruleVirtualCard(input),
    ruleIPCountryMismatch(input),
    ruleIssuerIntelligence(input),
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

// ─── Helper: Get Issuer Profile for a BIN ─────────────────────────────────

export function getIssuerProfileForBin(bin: string, issuerName?: string | null): IssuerProfile | null {
  return findIssuerByBinPrefix(bin) ?? findIssuerByName(issuerName ?? "")
}
