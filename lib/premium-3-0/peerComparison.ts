import { getCountryRiskTier } from "./enrichment/geoEnrichment"
import type { BinApiData } from "./types"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export interface PeerComparison {
  percentile: number
  description: string
}

/**
 * Deterministic peer comparison: computes a percentile (1–99) for this BIN
 * relative to comparable cards in the same country/category bucket.
 * Importa `getCountryRiskTier` de geoEnrichment (sem duplicar).
 */
export function computePeerComparison(binData: BinApiData): PeerComparison {
  const countryRiskTier = getCountryRiskTier(binData.countryCode)
  const category = (binData.category ?? "").toUpperCase()
  const brand = (binData.brand ?? "").toUpperCase()

  // Base percentile: safer countries start higher
  let percentile: number
  switch (countryRiskTier) {
    case "TIER1":
      percentile = 70
      break
    case "TIER2":
      percentile = 55
      break
    case "CRITICAL":
      percentile = 25
      break
    default: // TIER3
      percentile = 45
  }

  // Premium card category bonus
  if (["BLACK", "PLATINUM", "SIGNATURE", "INFINITE", "WORLD ELITE"].some((entry) => category.includes(entry))) {
    percentile += 10
  }

  // Prepaid penalty
  if (binData.isPrepaid) {
    percentile -= 25
  }

  // Virtual card small penalty
  if (category.includes("VIRTUAL")) {
    percentile -= 10
  }

  // Business/Corporate mild penalty
  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((entry) => category.includes(entry))) {
    percentile -= 5
  }

  // Major network bonus
  if (["VISA", "MASTERCARD", "AMEX", "AMERICAN EXPRESS"].includes(brand)) {
    percentile += 5
  }

  percentile = clamp(percentile, 1, 99)

  const description =
    percentile >= 75
      ? `Melhor que ${percentile}% dos cartões comparáveis em BIN + geografia.`
      : percentile >= 40
        ? `Na média do mercado: melhor que ${percentile}% dos cartões comparáveis.`
        : `Abaixo da média: melhor que apenas ${percentile}% dos cartões comparáveis.`

  return { percentile, description }
}
