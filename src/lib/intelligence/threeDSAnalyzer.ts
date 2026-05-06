// VeriFiBIN 2.0 — 3DS/VBV Profile Analyzer
// Produces inferred 3DS status based on brand, type, category, country and issuer.
// CRITICAL: APIs do not confirm 3DS directly. All results are probabilistic inferences.

import type {
  ThreeDSAnalysis,
  ThreeDSStatus,
  ConfidenceLevel,
  ThreeDSProtocol,
  AuthMethod,
} from "./types"
import { getCountryMaturity, type ThreeDSMaturityLevel } from "./countryMaturity"

export interface ThreeDSProfileInput {
  brand: string | null
  cardType: string | null
  cardCategory: string | null
  countryCode: string | null
  issuer: string | null
  isPrepaid: boolean
  isCommercial: boolean
}

interface ThreeDSScore {
  points: number
  reasons: string[]
}

// ─── Brand Analysis ────────────────────────────────────────────────────────

function analyzeBrand(brand: string | null): ThreeDSScore {
  if (!brand) return { points: 0, reasons: ["Bandeira não identificada"] }

  const b = brand.toUpperCase()

  if (["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].some((v) => b.includes(v))) {
    return { points: 30, reasons: [`Bandeira ${brand} possui suporte moderno a EMV 3DS`] }
  }
  if (["ELO", "HIPERCARD"].some((v) => b.includes(v))) {
    return { points: 20, reasons: [`Bandeira ${brand} com suporte regional a 3DS`] }
  }
  if (["DISCOVER", "JCB", "DINERS", "UNIONPAY"].some((v) => b.includes(v))) {
    return { points: 20, reasons: [`Bandeira ${brand} com suporte a 3DS`] }
  }

  return { points: 10, reasons: [`Bandeira ${brand} — suporte 3DS não catalogado`] }
}

// ─── Card Type Analysis ────────────────────────────────────────────────────

function analyzeCardType(cardType: string | null, isPrepaid: boolean): ThreeDSScore {
  if (isPrepaid) {
    return { points: -15, reasons: ["Cartão pré-pago — menor probabilidade de 3DS ativo"] }
  }

  if (!cardType) return { points: 0, reasons: ["Tipo de cartão não identificado"] }

  const t = cardType.toUpperCase()

  if (t.includes("CREDIT")) {
    return { points: 20, reasons: ["Cartão de crédito — alta probabilidade de 3DS ativo"] }
  }
  if (t.includes("DEBIT")) {
    return { points: 10, reasons: ["Cartão de débito — probabilidade moderada de 3DS (depende de país/banco)"] }
  }
  if (t.includes("PREPAID")) {
    return { points: -15, reasons: ["Cartão pré-pago — menor probabilidade de 3DS ativo"] }
  }
  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((v) => t.includes(v))) {
    return { points: 15, reasons: ["Cartão corporativo/business — geralmente suporta 3DS com regras empresariais"] }
  }

  return { points: 5, reasons: [`Tipo "${cardType}" — suporte 3DS não determinado`] }
}

// ─── Card Category Analysis ────────────────────────────────────────────────

function analyzeCardCategory(cardCategory: string | null, isCommercial: boolean): ThreeDSScore {
  if (isCommercial) {
    return { points: 15, reasons: ["Cartão comercial — alto suporte a 3DS com regras corporativas"] }
  }

  if (!cardCategory) return { points: 0, reasons: ["Categoria do cartão não identificada"] }

  const c = cardCategory.toUpperCase()

  if (["INFINITE", "BLACK", "WORLD ELITE", "SIGNATURE"].some((v) => c.includes(v))) {
    return { points: 25, reasons: [`Cartão ${cardCategory} — categoria premium com alto suporte a 3DS`] }
  }
  if (["PLATINUM"].some((v) => c.includes(v))) {
    return { points: 20, reasons: [`Cartão ${cardCategory} — alta probabilidade de 3DS`] }
  }
  if (["GOLD"].some((v) => c.includes(v))) {
    return { points: 15, reasons: [`Cartão ${cardCategory} — probabilidade elevada de 3DS`] }
  }
  if (["CLASSIC", "STANDARD"].some((v) => c.includes(v))) {
    return { points: 5, reasons: [`Cartão ${cardCategory} — suporte 3DS variável`] }
  }
  if (["ENHANCED DEBIT", "ENHANCED"].some((v) => c.includes(v))) {
    return { points: 10, reasons: [`Cartão ${cardCategory} — probabilidade média de 3DS`] }
  }

  return { points: 5, reasons: [`Categoria "${cardCategory}" — suporte 3DS não determinado`] }
}

// ─── Country Maturity Analysis ─────────────────────────────────────────────

function analyzeCountry(countryCode: string | null): ThreeDSScore & { maturity: ThreeDSMaturityLevel } {
  if (!countryCode) {
    return { points: 0, reasons: ["País não identificado"], maturity: "DESCONHECIDA" }
  }

  const config = getCountryMaturity(countryCode)

  switch (config.maturity) {
    case "ALTA":
      return {
        points: 25,
        reasons: [`País ${config.name} — maturidade 3DS ALTA (${config.regulatoryFramework})`],
        maturity: "ALTA",
      }
    case "MEDIA":
      return {
        points: 10,
        reasons: [`País ${config.name} — maturidade 3DS MÉDIA`],
        maturity: "MEDIA",
      }
    case "BAIXA":
      return {
        points: -10,
        reasons: [`País ${config.name} — maturidade 3DS BAIXA`],
        maturity: "BAIXA",
      }
    case "VARIAVEL":
      return {
        points: 0,
        reasons: [`País ${config.name} — maturidade 3DS VARIÁVEL por emissor`],
        maturity: "VARIAVEL",
      }
    default:
      return {
        points: 0,
        reasons: ["País desconhecido — maturidade 3DS não determinada"],
        maturity: "DESCONHECIDA",
      }
  }
}

// ─── Likely Protocol ───────────────────────────────────────────────────────

function inferProtocol(totalPoints: number, countryCode: string | null): ThreeDSProtocol {
  const maturity = getCountryMaturity(countryCode ?? "").maturity

  if (totalPoints >= 60) {
    if (maturity === "ALTA") return "EMV_3DS_2_2"
    return "EMV_3DS_2"
  }
  if (totalPoints >= 30) return "EMV_3DS_2"
  if (totalPoints >= 10) return "EMV_3DS_1"
  return "DESCONHECIDO"
}

// ─── Auth Methods ──────────────────────────────────────────────────────────

function inferAuthMethods(
  brand: string | null,
  countryCode: string | null,
  issuer: string | null,
): AuthMethod[] {
  const maturity = getCountryMaturity(countryCode ?? "").maturity
  const methods: AuthMethod[] = []

  if (maturity === "ALTA" || maturity === "MEDIA") {
    methods.push("OTP")
    methods.push("SMS")
    if (maturity === "ALTA") methods.push("APP_PUSH")
  }

  if (issuer) {
    const i = issuer.toUpperCase()
    if (["ITAU", "BRADESCO", "SANTANDER", "NUBANK", "INTER"].some((b) => i.includes(b))) {
      methods.push("APP_PUSH")
      methods.push("BIOMETRIA")
    }
  }

  if (methods.length === 0) return ["DESCONHECIDO"]
  return [...new Set(methods)] as AuthMethod[]
}

// ─── Build Technical Explanation ──────────────────────────────────────────

function buildExplanation(
  input: ThreeDSProfileInput,
  status: ThreeDSStatus,
  confidence: ConfidenceLevel,
  reasons: string[],
): string {
  const countryName = getCountryMaturity(input.countryCode ?? "").name
  const typeDesc = input.isPrepaid
    ? "pré-pago"
    : input.cardType?.toLowerCase() ?? "tipo desconhecido"

  const lines = [
    `Cartão ${input.brand ?? "bandeira desconhecida"} (${typeDesc}) emitido em ${countryName}.`,
    `Status 3DS: ${status} — Confiança: ${confidence}.`,
    "⚠️ Status inferido algoritmicamente. APIs de BIN normalmente NÃO confirmam 3DS/VBV diretamente.",
    "Baseado em: país de emissão, bandeira, tipo, categoria e emissor.",
    ...reasons,
  ]

  return lines.join(" ")
}

// ─── Main Function ─────────────────────────────────────────────────────────

export function analyzeThreeDSProfile(input: ThreeDSProfileInput): ThreeDSAnalysis {
  const brandScore = analyzeBrand(input.brand)
  const typeScore = analyzeCardType(input.cardType, input.isPrepaid)
  const categoryScore = analyzeCardCategory(input.cardCategory, input.isCommercial)
  const countryScore = analyzeCountry(input.countryCode)

  const totalPoints =
    brandScore.points + typeScore.points + categoryScore.points + countryScore.points

  const allReasons = [
    ...brandScore.reasons,
    ...typeScore.reasons,
    ...categoryScore.reasons,
    ...countryScore.reasons,
  ]

  // Determine status
  let status: ThreeDSStatus
  let confidence: ConfidenceLevel

  // When country is unknown, we can't determine 3DS status with any confidence
  if (!input.countryCode) {
    status = "DESCONHECIDO"
    confidence = "BAIXA"
  } else if (countryScore.maturity === "BAIXA") {
    // Low maturity countries lean toward inactive regardless of brand/type
    if (totalPoints >= 40) {
      status = "DESCONHECIDO"
      confidence = "BAIXA"
    } else {
      status = "INATIVO_PROVAVEL"
      confidence = "BAIXA"
    }
  } else if (totalPoints >= 60) {
    status = "ATIVO_PROVAVEL"
    confidence = "ALTA"
  } else if (totalPoints >= 35) {
    status = "ATIVO_PROVAVEL"
    confidence = "MEDIA"
  } else if (totalPoints >= 10) {
    status = "DESCONHECIDO"
    confidence = "BAIXA"
  } else {
    status = "INATIVO_PROVAVEL"
    confidence = "BAIXA"
  }

  // Determine challenge likelihood
  let challengeLikelihood: ConfidenceLevel
  const countryMaturity = countryScore.maturity
  if (countryMaturity === "ALTA") {
    challengeLikelihood = "ALTA"
  } else if (countryMaturity === "MEDIA") {
    challengeLikelihood = "MEDIA"
  } else {
    challengeLikelihood = "BAIXA"
  }

  const protocol = inferProtocol(totalPoints, input.countryCode)
  const authMethods = inferAuthMethods(input.brand, input.countryCode, input.issuer)
  const explanation = buildExplanation(input, status, confidence, allReasons)

  return {
    status,
    confidence,
    vbvLikely: status === "ATIVO_PROVAVEL",
    challengeLikelihood,
    protocolLikely: protocol,
    authMethodsLikely: authMethods,
    technicalExplanation: explanation,
    isInferred: true,
  }
}
