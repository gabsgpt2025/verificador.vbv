// VeriFiBIN 2.0 — 3DS/VBV Profile Analyzer (Enhanced)
// Produces inferred 3DS status based on brand, type, category, country and issuer.
// CRITICAL: APIs do not confirm 3DS directly. All results are probabilistic inferences.
// Enhanced with: frictionless flow detection, bypass mechanism classification, issuer intelligence

import type {
  ThreeDSAnalysis,
  ThreeDSStatus,
  ConfidenceLevel,
  ThreeDSProtocol,
  AuthMethod,
} from "./types"
import { getCountryMaturity, type ThreeDSMaturityLevel } from "./countryMaturity"
import {
  findIssuerByBinPrefix,
  findIssuerByName,
  type IssuerProfile,
  type FrictionlessLikelihood,
  type BypassMechanism,
} from "./issuerIntelligence"

export interface ThreeDSProfileInput {
  bin?: string
  brand: string | null
  cardType: string | null
  cardCategory: string | null
  countryCode: string | null
  issuer: string | null
  isPrepaid: boolean
  isCommercial: boolean
}

// Extended analysis result with frictionless/bypass info
export interface ThreeDSAnalysisEnhanced extends ThreeDSAnalysis {
  frictionlessLikelihood: FrictionlessLikelihood
  bypassMechanism: BypassMechanism
  bypassMechanismDescription: string
  issuerProfileFound: boolean
  frictionlessExplanation: string
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
    return { points: 30, reasons: [`Bandeira ${brand} possui suporte moderno a EMV 3DS 2.x`] }
  }
  if (["ELO", "HIPERCARD"].some((v) => b.includes(v))) {
    return { points: 20, reasons: [`Bandeira ${brand} com suporte regional a 3DS (Brasil)`] }
  }
  if (["DISCOVER", "JCB", "DINERS", "UNIONPAY"].some((v) => b.includes(v))) {
    return { points: 20, reasons: [`Bandeira ${brand} com suporte a 3DS`] }
  }

  return { points: 10, reasons: [`Bandeira ${brand} — suporte 3DS não catalogado`] }
}

// ─── Card Type Analysis ────────────────────────────────────────────────────

function analyzeCardType(cardType: string | null, isPrepaid: boolean): ThreeDSScore {
  if (isPrepaid) {
    return { points: -15, reasons: ["Cartão pré-pago — menor probabilidade de 3DS ativo; maior risco de bypass"] }
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
    return {
      points: 15,
      reasons: ["Cartão corporativo/business — 3DS presente mas com alta probabilidade de isenção B2B"],
    }
  }

  return { points: 5, reasons: [`Tipo "${cardType}" — suporte 3DS não determinado`] }
}

// ─── Card Category Analysis ────────────────────────────────────────────────

function analyzeCardCategory(cardCategory: string | null, isCommercial: boolean): ThreeDSScore {
  if (isCommercial) {
    return {
      points: 15,
      reasons: ["Cartão comercial — 3DS presente mas com alta probabilidade de isenção SCA B2B"],
    }
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
  if (["BUSINESS", "CORPORATE", "EMPRESARIAL"].some((v) => c.includes(v))) {
    return {
      points: 10,
      reasons: [`Cartão ${cardCategory} — 3DS presente com isenção B2B aplicável`],
    }
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
        reasons: [`País ${config.name} — maturidade 3DS ALTA (${config.regulatoryFramework}). ${config.notes}`],
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
        reasons: [`País ${config.name} — maturidade 3DS BAIXA. ${config.notes}`],
        maturity: "BAIXA",
      }
    case "VARIAVEL":
      return {
        points: 0,
        reasons: [`País ${config.name} — maturidade 3DS VARIÁVEL por emissor. ${config.notes}`],
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

// ─── Frictionless Likelihood from Issuer Profile ──────────────────────────

function analyzeFrictionless(
  issuerProfile: IssuerProfile | null,
  countryMaturity: ThreeDSMaturityLevel,
  isCommercial: boolean,
  isPrepaid: boolean,
): { frictionlessLikelihood: FrictionlessLikelihood; bypassMechanism: BypassMechanism; explanation: string } {

  // If we have an issuer profile, use it directly
  if (issuerProfile) {
    const explanations: Record<BypassMechanism, string> = {
      FRICTIONLESS_3DS2: `${issuerProfile.name} utiliza 3DS 2.0 com fluxo frictionless — autenticação silenciosa pelo ACS do emissor sem desafio visual ao portador.`,
      SCA_EXEMPTION_B2B: `${issuerProfile.name} aplica isenção SCA para pagamentos corporativos (PSD2 B2B Exemption) — 3DS presente mas suprimido automaticamente.`,
      SCA_EXEMPTION_LOW_VALUE: `${issuerProfile.name} aplica isenção de baixo valor — transações abaixo do limiar aprovam sem desafio 3DS.`,
      SCA_EXEMPTION_TRA: `${issuerProfile.name} utiliza isenção por Análise de Risco de Transação (TRA) — emissor com baixa taxa de fraude pode suprimir 3DS.`,
      "3DS_NOMINAL": `${issuerProfile.name} aparece como 'enrolled' no diretório 3DS, mas não possui ACS real implementado — autenticação não ocorre efetivamente.`,
      GATEWAY_FALLBACK: `${issuerProfile.name} é frequentemente usado em gateways que não implementam fallback completo de 3DS.`,
      NO_3DS: `${issuerProfile.name} não implementa 3D Secure — transações online sem autenticação adicional.`,
      UNKNOWN: `Mecanismo de bypass para ${issuerProfile.name} não determinado com precisão.`,
    }

    return {
      frictionlessLikelihood: issuerProfile.frictionlessLikelihood,
      bypassMechanism: issuerProfile.bypassMechanism,
      explanation: explanations[issuerProfile.bypassMechanism],
    }
  }

  // Infer from available data
  if (isCommercial) {
    return {
      frictionlessLikelihood: "ALTA",
      bypassMechanism: "SCA_EXEMPTION_B2B",
      explanation: "Cartão corporativo — alta probabilidade de isenção SCA B2B aplicada pelo emissor ou gateway.",
    }
  }

  if (isPrepaid) {
    return {
      frictionlessLikelihood: "ALTA",
      bypassMechanism: "UNKNOWN",
      explanation: "Cartão pré-pago — emissores de pré-pagos frequentemente têm implementação 3DS mais fraca ou ausente.",
    }
  }

  // Based on country maturity
  const maturityMap: Record<ThreeDSMaturityLevel, { likelihood: FrictionlessLikelihood; mechanism: BypassMechanism; explanation: string }> = {
    ALTA: {
      likelihood: "MEDIA",
      mechanism: "FRICTIONLESS_3DS2",
      explanation: "País com alta maturidade 3DS — 3DS ativo com probabilidade moderada de fluxo frictionless em transações de baixo risco.",
    },
    MEDIA: {
      likelihood: "ALTA",
      mechanism: "FRICTIONLESS_3DS2",
      explanation: "País com maturidade 3DS média — probabilidade alta de fluxo frictionless ou ausência de desafio.",
    },
    BAIXA: {
      likelihood: "MUITO_ALTA",
      mechanism: "NO_3DS",
      explanation: "País com baixa maturidade 3DS — alta probabilidade de ausência de autenticação.",
    },
    VARIAVEL: {
      likelihood: "ALTA",
      mechanism: "UNKNOWN",
      explanation: "País com maturidade 3DS variável — comportamento depende do emissor específico.",
    },
    DESCONHECIDA: {
      likelihood: "ALTA",
      mechanism: "UNKNOWN",
      explanation: "País não identificado — não é possível determinar comportamento 3DS.",
    },
  }

  const result = maturityMap[countryMaturity]
  return {
    frictionlessLikelihood: result.likelihood,
    bypassMechanism: result.mechanism,
    explanation: result.explanation,
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
    if (["ITAU", "BRADESCO", "SANTANDER", "NUBANK", "INTER", "C6", "PAGBANK", "MONOBANK"].some((b) => i.includes(b))) {
      methods.push("APP_PUSH")
      methods.push("BIOMETRIA")
    }
    if (["REVOLUT", "N26", "WISE"].some((b) => i.includes(b))) {
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
  frictionlessExplanation: string,
): string {
  const countryName = getCountryMaturity(input.countryCode ?? "").name
  const typeDesc = input.isPrepaid
    ? "pré-pago"
    : input.cardType?.toLowerCase() ?? "tipo desconhecido"

  const lines = [
    `Cartão ${input.brand ?? "bandeira desconhecida"} (${typeDesc}) emitido em ${countryName}.`,
    `Status 3DS: ${status} — Confiança: ${confidence}.`,
    frictionlessExplanation,
    "⚠️ Status inferido algoritmicamente. APIs de BIN normalmente NÃO confirmam 3DS/VBV diretamente.",
    "Baseado em: país de emissão, bandeira, tipo, categoria, emissor e base de inteligência proprietária.",
    ...reasons,
  ]

  return lines.join(" ")
}

// ─── Main Function ─────────────────────────────────────────────────────────

export function analyzeThreeDSProfile(input: ThreeDSProfileInput): ThreeDSAnalysisEnhanced {
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

  // Look up issuer profile from our intelligence database
  const issuerProfile = input.bin
    ? (findIssuerByBinPrefix(input.bin) ?? findIssuerByName(input.issuer ?? ""))
    : findIssuerByName(input.issuer ?? "")

  // Analyze frictionless/bypass
  const frictionlessAnalysis = analyzeFrictionless(
    issuerProfile,
    countryScore.maturity,
    input.isCommercial,
    input.isPrepaid,
  )

  // Determine status
  let status: ThreeDSStatus
  let confidence: ConfidenceLevel

  // If issuer profile says no 3DS, override
  if (issuerProfile && !issuerProfile.threeDSActive) {
    status = "INATIVO_PROVAVEL"
    confidence = "ALTA"
  } else if (issuerProfile && issuerProfile.threeDSActive) {
    // 3DS is active but may be frictionless
    status = "ATIVO_PROVAVEL"
    confidence = issuerProfile.frictionlessLikelihood === "MUITO_ALTA" ? "ALTA" : "MEDIA"
  } else if (!input.countryCode) {
    status = "DESCONHECIDO"
    confidence = "BAIXA"
  } else if (countryScore.maturity === "BAIXA") {
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
  // Note: "challenge" = visual 3DS challenge presented to user
  // Frictionless = 3DS active but no challenge shown
  let challengeLikelihood: ConfidenceLevel
  const countryMaturity = countryScore.maturity

  // If frictionless is very likely, challenge is unlikely
  if (frictionlessAnalysis.frictionlessLikelihood === "MUITO_ALTA") {
    challengeLikelihood = "BAIXA"
  } else if (frictionlessAnalysis.frictionlessLikelihood === "ALTA") {
    challengeLikelihood = "BAIXA"
  } else if (countryMaturity === "ALTA") {
    challengeLikelihood = "ALTA"
  } else if (countryMaturity === "MEDIA") {
    challengeLikelihood = "MEDIA"
  } else {
    challengeLikelihood = "BAIXA"
  }

  const protocol = inferProtocol(totalPoints, input.countryCode)
  const authMethods = inferAuthMethods(input.brand, input.countryCode, input.issuer)
  const explanation = buildExplanation(
    input,
    status,
    confidence,
    allReasons,
    frictionlessAnalysis.explanation,
  )

  return {
    status,
    confidence,
    vbvLikely: status === "ATIVO_PROVAVEL",
    challengeLikelihood,
    protocolLikely: protocol,
    authMethodsLikely: authMethods,
    technicalExplanation: explanation,
    isInferred: true,
    // Enhanced fields
    frictionlessLikelihood: frictionlessAnalysis.frictionlessLikelihood,
    bypassMechanism: frictionlessAnalysis.bypassMechanism,
    bypassMechanismDescription: frictionlessAnalysis.explanation,
    issuerProfileFound: issuerProfile !== null,
    frictionlessExplanation: frictionlessAnalysis.explanation,
  }
}
