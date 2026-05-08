import type { BinApiData, BinRiskFactor } from "../types"

export function calculateCardLevelRisk(binData: BinApiData) {
  let score = 0
  const factors: BinRiskFactor[] = []
  const category = (binData.category ?? "").toUpperCase()
  const cardType = (binData.type ?? "").toUpperCase()

  if (binData.isPrepaid || cardType.includes("PREPAID")) {
    score += 25
    factors.push({ label: "Cartão pré-pago", impact: 25, reason: "Produtos pré-pagos recebem ajuste de risco positivo." })
  }
  if (category.includes("VIRTUAL")) {
    score += 15
    factors.push({ label: "Cartão virtual", impact: 15, reason: "Cartões virtuais têm maior rotatividade digital." })
  }
  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((entry) => category.includes(entry))) {
    score += 5
    factors.push({ label: "Cartão business", impact: 5, reason: "Cartões corporativos recebem ajuste moderado." })
  }
  if (category.includes("BLACK") || category.includes("INFINITE") || category.includes("WORLD ELITE")) {
    score -= 15
    factors.push({ label: "Cartão BLACK", impact: -15, reason: "Linhas premium têm melhor perfil histórico." })
  } else if (category.includes("PLATINUM")) {
    score -= 10
    factors.push({ label: "Cartão PLATINUM", impact: -10, reason: "Linha platinum reduz risco relativo." })
  } else if (category.includes("GOLD")) {
    score -= 5
    factors.push({ label: "Cartão GOLD", impact: -5, reason: "Linha gold reduz levemente o risco relativo." })
  } else if (category.includes("CLASSIC") || category.includes("STANDARD")) {
    factors.push({ label: "Cartão CLASSIC/STANDARD", impact: 0, reason: "Categoria clássica sem ajuste adicional." })
  }

  if (factors.length === 0) {
    factors.push({
      label: "Nível do cartão sem ajuste adicional",
      impact: 0,
      reason: "A categoria do cartão não ativou modificadores extras de risco neste cenário.",
    })
  }

  return { score, factors }
}
