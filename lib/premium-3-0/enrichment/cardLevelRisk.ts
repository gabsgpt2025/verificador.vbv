import type { BinApiData, BinRiskFactor } from "../types"

export function calculateCardLevelRisk(binData: BinApiData) {
  let score = 0
  const factors: BinRiskFactor[] = []
  const category = (binData.category ?? "").toUpperCase()

  if (["BLACK", "PLATINUM", "SIGNATURE", "INFINITE", "WORLD ELITE"].some((entry) => category.includes(entry))) {
    score -= 10
    factors.push({
      label: "Cartão premium",
      impact: -10,
      reason: "Categorias premium costumam ter controles emissores e autenticação mais consistentes.",
    })
  }

  if (["BUSINESS", "CORPORATE", "COMMERCIAL"].some((entry) => category.includes(entry))) {
    score += 5
    factors.push({
      label: "Cartão corporativo",
      impact: 5,
      reason: "Cartões empresariais pedem leitura adicional do contexto de compra e do gateway.",
    })
  }

  if (binData.isPrepaid) {
    score += 25
    factors.push({
      label: "Cartão pré-pago",
      impact: 25,
      reason: "Produtos pré-pagos costumam apresentar maior risco operacional e menor previsibilidade.",
    })
  }

  if (category.includes("VIRTUAL")) {
    score += 15
    factors.push({
      label: "Cartão virtual",
      impact: 15,
      reason: "Cartões virtuais exigem atenção adicional por sua alta rotatividade em ambientes digitais.",
    })
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
