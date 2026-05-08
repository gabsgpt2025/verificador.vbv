import threeDsByBank from "./data/threeDsByBank.json"
import { getCountryMaturity } from "./country3dsMaturity"
import { normalizeIssuerName } from "./enrichment/bankReputation"
import { getCountryRiskTier } from "./enrichment/geoEnrichment"
import type { BinApiData, BinThreeDSResult } from "./types"

type ThreeDSContextInput = {
  amount?: number
  currency?: string
}

const THREE_DS_BY_BANK = new Map<string, number>(
  Object.entries(threeDsByBank).map(([issuer, adoption]) => [normalizeIssuerName(issuer), Number(adoption)]),
)

const EUR_EXCHANGE_RATE: Record<string, number> = {
  EUR: 1,
  BRL: 0.18,
  USD: 0.92,
  GBP: 1.16,
  CAD: 0.67,
  AUD: 0.6,
  MXN: 0.05,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function convertAmountToEur(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = EUR_EXCHANGE_RATE[(currency ?? "EUR").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function inferProtocol(
  brand?: string,
  countryCode?: string,
  frictionlessProbability?: number,
): BinThreeDSResult["protocolLikely"] {
  const normalizedBrand = (brand ?? "").toUpperCase()
  const maturity = getCountryMaturity(countryCode)

  if (!["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(normalizedBrand)) {
    return "UNKNOWN"
  }

  if ((frictionlessProbability ?? 0) >= 70 && maturity?.maturity === "HIGH") {
    return "EMV_3DS_2_2"
  }

  if ((frictionlessProbability ?? 0) >= 45) {
    return "EMV_3DS_2"
  }

  return "UNKNOWN"
}

function buildExplanation(
  binData: BinApiData,
  confidence: BinThreeDSResult["confidence"],
  frictionlessProbability: number,
  challengeProbability: number,
  applicableBypassMechanisms: BinThreeDSResult["applicableBypassMechanisms"],
): BinThreeDSResult["explanation"] {
  const issuerText = binData.issuer ? `emissor ${binData.issuer}` : "emissor sem benchmark específico"
  const countryText = binData.countryName ?? binData.countryCode ?? "país não informado"
  const mechanismsText =
    applicableBypassMechanisms.length > 0
      ? ` Mecanismos aplicáveis: ${applicableBypassMechanisms.join(", ")}.`
      : " Não há mecanismo de bypass favorável claramente aplicável."

  return {
    technical:
      `Análise 3DS inferida para ${issuerText}, ${countryText}. ` +
      `Frictionless estimado em ${frictionlessProbability}% e challenge em ${challengeProbability}% ` +
      `com confiança ${confidence.toLowerCase()}.` +
      mechanismsText,
    popular:
      `O cartão tem cerca de ${frictionlessProbability}% de chance de seguir sem desafio e ${challengeProbability}% de pedir challenge 3DS. ` +
      (applicableBypassMechanisms.length > 0
        ? `Há sinais favoráveis para ${applicableBypassMechanisms.join(", ")}.`
        : "Não apareceu um atalho 3DS favorável claro."),
  }
}

export interface ThreeDSExtendedResult {
  frictionlessProbability: number
  bypassProbability: number
  bypassMechanisms: BinThreeDSResult["applicableBypassMechanisms"]
}

/**
 * Lightweight extended 3DS analysis returning only the key probabilities
 * and applicable bypass mechanisms. Does not replace `analyzeThreeDS`.
 */
export function analyzeThreeDSExtended(binData: BinApiData, context?: ThreeDSContextInput): ThreeDSExtendedResult {
  const result = analyzeThreeDS(binData, context)
  return {
    frictionlessProbability: result.frictionlessProbability,
    bypassProbability: result.bypassProbability,
    bypassMechanisms: result.applicableBypassMechanisms,
  }
}

export function analyzeThreeDS(binData: BinApiData, context?: ThreeDSContextInput): BinThreeDSResult {
  const normalizedIssuer = normalizeIssuerName(binData.issuer)
  const issuerAdoption = THREE_DS_BY_BANK.get(normalizedIssuer)
  const countryRiskTier = getCountryRiskTier(binData.countryCode)
  const amountInEur = convertAmountToEur(context?.amount, context?.currency ?? binData.currency)

  let frictionlessProbability = typeof issuerAdoption === "number" ? issuerAdoption * 100 : 50

  if (amountInEur !== null && amountInEur < 30) {
    frictionlessProbability += 20
  }

  if (countryRiskTier === "TIER1") {
    frictionlessProbability += 10
  } else if (countryRiskTier === "TIER2") {
    frictionlessProbability += 5
  } else if (countryRiskTier === "TIER3") {
    frictionlessProbability -= 10
  } else {
    frictionlessProbability -= 20
  }

  if (binData.isPrepaid) {
    frictionlessProbability -= 30
  }

  frictionlessProbability = clamp(frictionlessProbability, 0, 100)

  let challengeProbability = clamp(100 - frictionlessProbability, 0, 100)
  if (binData.isPrepaid) {
    challengeProbability = clamp(challengeProbability + 10, 0, 100)
  }

  const applicableBypassMechanisms: BinThreeDSResult["applicableBypassMechanisms"] = []

  if (amountInEur !== null && amountInEur < 30) {
    applicableBypassMechanisms.push("SCA_EXEMPTION_LOW_VALUE")
  }

  if (!binData.isPrepaid && (countryRiskTier === "TIER1" || countryRiskTier === "TIER2") && frictionlessProbability >= 65) {
    applicableBypassMechanisms.push("TRA")
  }

  const category = (binData.category ?? "").toUpperCase()
  if (category.includes("RECURR")) {
    applicableBypassMechanisms.push("RECURRING")
  }

  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((entry) => category.includes(entry))) {
    applicableBypassMechanisms.push("MIT")
  }

  if (frictionlessProbability >= 70) {
    applicableBypassMechanisms.push("FRICTIONLESS_3DS2")
  }

  const bypassProbability = clamp(
    frictionlessProbability - Math.round(challengeProbability * 0.25) + applicableBypassMechanisms.length * 8,
    0,
    100,
  )

  let status: BinThreeDSResult["status"]
  if (frictionlessProbability >= 70) {
    status = "LIKELY_ACTIVE"
  } else if (frictionlessProbability >= 45) {
    status = "UNKNOWN"
  } else {
    status = "LIKELY_INACTIVE"
  }

  const confidence: BinThreeDSResult["confidence"] =
    typeof issuerAdoption === "number" ? "HIGH" : countryRiskTier === "TIER1" || countryRiskTier === "TIER2" ? "MEDIUM" : "LOW"

  const challengeLikelihood: BinThreeDSResult["challengeLikelihood"] =
    challengeProbability >= 70 ? "HIGH" : challengeProbability >= 35 ? "MEDIUM" : frictionlessProbability >= 70 ? "LOW" : "UNKNOWN"

  const protocolLikely = inferProtocol(binData.brand, binData.countryCode, frictionlessProbability)

  const authMethodsLikely =
    challengeProbability >= 60
      ? ["OTP", "APP_PUSH", "BIOMETRIA"]
      : challengeProbability >= 35
        ? ["OTP", "APP_PUSH"]
        : ["RBA", "DEVICE_BINDING"]

  return {
    status,
    confidence,
    challengeLikelihood,
    protocolLikely,
    authMethodsLikely,
    explanation: buildExplanation(
      binData,
      confidence,
      frictionlessProbability,
      challengeProbability,
      applicableBypassMechanisms,
    ),
    inferred: true,
    frictionlessProbability,
    challengeProbability,
    bypassProbability,
    applicableBypassMechanisms,
  }
}
