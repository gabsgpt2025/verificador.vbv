import { lookupBank } from "./enrichment/bankReputation"
import { getCountryRiskTier } from "./enrichment/geoEnrichment"
import type { BinApiData, BinThreeDSResult } from "./types"

type ThreeDSContextInput = {
  amount?: number
  currency?: string
}

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

function toEur(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = EUR_EXCHANGE_RATE[(currency ?? "EUR").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function inferProtocol(frictionlessProbability: number): BinThreeDSResult["protocolLikely"] {
  if (frictionlessProbability >= 80) return "EMV_3DS_2_2"
  if (frictionlessProbability >= 60) return "EMV_3DS_2"
  if (frictionlessProbability >= 40) return "EMV_3DS_2_1"
  return "UNKNOWN"
}

export function analyzeThreeDS(binData: BinApiData, context?: ThreeDSContextInput): BinThreeDSResult {
  const brand = (binData.brand ?? "").toUpperCase()
  const countryCode = (binData.countryCode ?? "").toUpperCase()
  const countryTier = getCountryRiskTier(countryCode)
  const bank = lookupBank(binData.issuer ?? "")
  const amountEur = toEur(context?.amount, context?.currency ?? binData.currency)

  let frictionlessLikelihood = 45

  if (brand === "AMEX" || brand === "AMERICAN EXPRESS") {
    frictionlessLikelihood += 20
  }

  if (countryTier === "tier1") {
    frictionlessLikelihood += 15
  } else if (countryTier === "tier2") {
    frictionlessLikelihood -= 5
  } else if (countryTier === "tier3") {
    frictionlessLikelihood -= 10
  } else if (countryTier === "critical") {
    frictionlessLikelihood -= 25
  }

  if ((bank?.threeDsAdoption ?? 0) > 90) {
    frictionlessLikelihood += 20
  }

  if (amountEur !== null && amountEur < 30) {
    frictionlessLikelihood += 25
  }

  if (amountEur !== null && amountEur > 500) {
    frictionlessLikelihood -= 30
  }

  frictionlessLikelihood = clamp(frictionlessLikelihood, 0, 100)
  const challengeProbability = clamp(100 - frictionlessLikelihood, 0, 100)

  const applicableBypassMechanisms: BinThreeDSResult["applicableBypassMechanisms"] = []

  if (amountEur !== null && amountEur < 30) {
    applicableBypassMechanisms.push("SCA_EXEMPTION_LOW_VALUE")
  }

  if ((brand === "AMEX" || brand === "AMERICAN EXPRESS") && (bank?.threeDsAdoption ?? 0) > 95) {
    applicableBypassMechanisms.push("FRICTIONLESS_3DS2")
  }

  if (countryTier === "tier1" && frictionlessLikelihood >= 65) {
    applicableBypassMechanisms.push("TRA")
  }

  if ((binData.category ?? "").toUpperCase().includes("RECURR")) {
    applicableBypassMechanisms.push("RECURRING")
  }

  if ((binData.category ?? "").toUpperCase().includes("BUSINESS") || binData.isCommercial) {
    applicableBypassMechanisms.push("MIT")
  }

  const confidence: BinThreeDSResult["confidence"] = bank ? "HIGH" : countryTier === "tier1" ? "MEDIUM" : "LOW"

  const status: BinThreeDSResult["status"] =
    frictionlessLikelihood >= 60 ? "LIKELY_ACTIVE" : frictionlessLikelihood >= 40 ? "UNKNOWN" : "LIKELY_INACTIVE"

  const challengeLikelihood: BinThreeDSResult["challengeLikelihood"] =
    challengeProbability >= 70 ? "HIGH" : challengeProbability >= 35 ? "MEDIUM" : "LOW"

  const bankText = binData.issuer ?? "Issuer not in benchmark base"
  const adoptionText = bank ? `${bank.threeDsAdoption}%` : "N/A"
  const defaultMethodText = bank?.defaultMethod ?? "NONE"
  const maturityText = bank?.threeDsMaturity ?? "MEDIUM"
  const amountText = amountEur !== null ? amountEur.toFixed(2) : "N/A"

  const technicalExplanation =
    `Bank ${bankText} has ${adoptionText} 3DS adoption with ${defaultMethodText} as default. ` +
    `Amount ${amountText} EUR ${amountEur !== null && amountEur < 30 ? "within" : "above"} SCA exemption threshold. ` +
    `Country ${countryCode || "N/A"} ${countryTier} with ${maturityText} 3DS maturity. ` +
    `Estimated frictionless: ${frictionlessLikelihood}%.`

  const popularExplanation =
    `Banco ${bank ? "com" : "sem"} benchmark robusto de segurança 3DS. ` +
    `Para esta compra, há ${frictionlessLikelihood}% de chance do cliente não precisar de autenticação extra.`

  return {
    status,
    confidence,
    challengeLikelihood,
    protocolLikely: inferProtocol(frictionlessLikelihood),
    authMethodsLikely:
      challengeProbability >= 60 ? ["OTP", "APP_PUSH", "BIOMETRIA"] : challengeProbability >= 35 ? ["OTP", "APP_PUSH"] : ["RBA", "DEVICE_BINDING"],
    explanation: {
      technical: technicalExplanation,
      popular: popularExplanation,
    },
    inferred: true,
    frictionlessProbability: frictionlessLikelihood,
    challengeProbability,
    bypassProbability: clamp(frictionlessLikelihood - Math.round(challengeProbability * 0.25) + applicableBypassMechanisms.length * 8, 0, 100),
    applicableBypassMechanisms,
  }
}
