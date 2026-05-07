// lib/premium-3-0/calculateDataQuality.ts
// Avalia qualidade dos dados retornados pela API

import type { BinApiData, BinDataQualityAnalysis } from "./types"

const KEY_FIELDS: Array<keyof BinApiData> = [
  "brand",
  "type",
  "category",
  "countryCode",
  "issuer",
]

const INFERRED_FIELDS = [
  "threeDSAnalysis",
  "riskAnalysis",
  "compliance",
  "finalSummary",
]

export function calculateDataQuality(binData: BinApiData): BinDataQualityAnalysis {
  const missingFields: string[] = []
  const realApiFields: string[] = []

  for (const field of KEY_FIELDS) {
    const value = binData[field]
    if (value === undefined || value === null || value === "") {
      missingFields.push(field)
    } else {
      realApiFields.push(field)
    }
  }

  // Also count optional real fields if present
  if (binData.countryName) realApiFields.push("countryName")
  if (binData.currency) realApiFields.push("currency")
  if (binData.issuerWebsite) realApiFields.push("issuerWebsite")
  if (binData.issuerPhone) realApiFields.push("issuerPhone")
  if (binData.isPrepaid !== undefined) realApiFields.push("isPrepaid")
  if (binData.isCommercial !== undefined) realApiFields.push("isCommercial")

  const presentCount = KEY_FIELDS.length - missingFields.length
  const score = Math.round((presentCount / KEY_FIELDS.length) * 100)

  let level: BinDataQualityAnalysis["level"]
  if (score >= 80) level = "HIGH"
  else if (score >= 40) level = "MEDIUM"
  else level = "LOW"

  return {
    score,
    level,
    missingFields,
    realApiFields,
    inferredFields: INFERRED_FIELDS,
  }
}
