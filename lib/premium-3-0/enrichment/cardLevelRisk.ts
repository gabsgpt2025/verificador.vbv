import type { BinApiData, BinRiskFactor } from "../types"

function normalize(value?: string | null) {
  return (value ?? "").toUpperCase()
}

export function cardLevelRiskAdjustment(level?: string, type?: string, isPrepaid?: boolean, isCommercial?: boolean): number {
  const normalizedLevel = normalize(level)
  const normalizedType = normalize(type)
  let adjustment = 0

  if (normalizedLevel.includes("BLACK") || normalizedLevel.includes("INFINITE")) {
    adjustment -= 15
  } else if (normalizedLevel.includes("PLATINUM")) {
    adjustment -= 10
  } else if (normalizedLevel.includes("GOLD")) {
    adjustment -= 5
  }

  if (
    isCommercial ||
    normalizedLevel.includes("BUSINESS") ||
    normalizedLevel.includes("CORPORATE") ||
    normalizedType.includes("BUSINESS") ||
    normalizedType.includes("CORPORATE")
  ) {
    adjustment += 5
  }

  if (isPrepaid) {
    adjustment += 25
  }

  if (normalizedLevel.includes("VIRTUAL") || normalizedLevel.includes("ELECTRON") || normalizedType.includes("ELECTRON")) {
    adjustment += 15
  }

  return adjustment
}

export function calculateCardLevelRisk(binData: BinApiData) {
  const factors: BinRiskFactor[] = []
  const adjustment = cardLevelRiskAdjustment(binData.category, binData.type, binData.isPrepaid, binData.isCommercial)

  if (adjustment === 0) {
    factors.push({
      label: "Card level sem ajuste adicional",
      impact: 0,
      reason: "Nível/tipo do cartão não acionou regras adicionais de risco.",
    })
  } else {
    factors.push({
      label: "Ajuste por nível/tipo do cartão",
      impact: adjustment,
      reason: "Ajuste aplicado por categoria premium, perfil comercial/prepaid e características virtual/electron.",
    })
  }

  return { score: adjustment, factors }
}
