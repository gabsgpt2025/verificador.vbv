// VeriFiBIN 2.0 — Data Quality Module
// Checks completeness and consistency of BIN data from API

import type { DataQuality } from "./types"

export interface DataQualityInput {
  bin: string | null
  brand: string | null
  cardType: string | null
  cardCategory: string | null
  country: string | null
  countryCode: string | null
  currency: string | null
  issuer: string | null
  issuerWebsite: string | null
  issuerPhone: string | null
  isPrepaid: boolean | null
  isCommercial: boolean | null
}

// Fields that come directly from API (when present)
const REAL_API_FIELD_NAMES = [
  "brand",
  "cardType",
  "country",
  "countryCode",
  "currency",
  "issuer",
  "issuerWebsite",
  "issuerPhone",
  "isPrepaid",
  "isCommercial",
  "cardCategory",
]

// Fields that are always inferred
const ALWAYS_INFERRED = [
  "threeDSAnalysis",
  "challengeLikelihood",
  "protocolLikely",
  "authMethodsLikely",
  "riskAnalysis",
  "complianceData",
  "finalSummary",
]

export function assessDataQuality(input: DataQualityInput): DataQuality {
  const missingFields: string[] = []
  const realApiFields: string[] = []
  const warnings: string[] = []

  // Check each field
  const fieldChecks: Array<{ name: string; value: unknown }> = [
    { name: "brand", value: input.brand },
    { name: "cardType", value: input.cardType },
    { name: "cardCategory", value: input.cardCategory },
    { name: "country", value: input.country },
    { name: "countryCode", value: input.countryCode },
    { name: "currency", value: input.currency },
    { name: "issuer", value: input.issuer },
    { name: "issuerWebsite", value: input.issuerWebsite },
    { name: "issuerPhone", value: input.issuerPhone },
    { name: "isPrepaid", value: input.isPrepaid },
    { name: "isCommercial", value: input.isCommercial },
  ]

  for (const { name, value } of fieldChecks) {
    if (value === null || value === undefined || value === "") {
      missingFields.push(name)
    } else {
      realApiFields.push(name)
    }
  }

  // Core fields that are essential for analysis
  const coreFields = ["brand", "cardType", "country", "countryCode"]
  const missingCore = coreFields.filter((f) => missingFields.includes(f))

  if (missingCore.length > 0) {
    warnings.push(`Campos essenciais ausentes: ${missingCore.join(", ")}`)
  }

  if (missingFields.includes("issuer")) {
    warnings.push(
      "Emissor não identificado — análise de risco pode ser menos precisa",
    )
  }

  if (missingFields.includes("cardCategory")) {
    warnings.push("Categoria do cartão não disponível — inferência 3DS com menor confiança")
  }

  // Conflict detection
  let conflictingDataDetected = false

  if (
    input.cardType &&
    input.isPrepaid === true &&
    input.cardType.toUpperCase().includes("CREDIT")
  ) {
    conflictingDataDetected = true
    warnings.push("Conflito: cartão marcado como 'crédito' e também como 'pré-pago'")
  }

  if (
    input.cardType &&
    input.isCommercial === true &&
    ["PREPAID", "PRE-PAID"].some((t) => input.cardType!.toUpperCase().includes(t))
  ) {
    conflictingDataDetected = true
    warnings.push("Conflito: cartão pré-pago marcado como comercial")
  }

  // Calculate completeness and score
  const totalFields = fieldChecks.length
  const presentFields = totalFields - missingFields.length
  const apiDataCompleteness = Math.round((presentFields / totalFields) * 100)

  // Score: starts at completeness, penalized by conflicts and missing core
  let qualityScore = apiDataCompleteness
  if (conflictingDataDetected) qualityScore = Math.max(0, qualityScore - 20)
  qualityScore = Math.max(0, qualityScore - missingCore.length * 10)

  return {
    score: qualityScore,
    missingFields,
    realApiFields,
    inferredFields: ALWAYS_INFERRED,
    apiDataCompleteness,
    issuerKnown: !missingFields.includes("issuer"),
    countryKnown: !missingFields.includes("countryCode"),
    categoryKnown: !missingFields.includes("cardCategory"),
    typeKnown: !missingFields.includes("cardType"),
    conflictingDataDetected,
    warnings,
  }
}
