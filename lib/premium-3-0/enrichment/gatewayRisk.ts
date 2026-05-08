import type { BinRiskFactor } from "../types"

type GatewayContext = {
  amount?: number
  currency?: string
  mcc?: string
  gateway?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export function enrichGateway(context: GatewayContext = {}) {
  const factors: BinRiskFactor[] = []
  const hasData =
    typeof context.amount === "number" ||
    Boolean(context.currency) ||
    Boolean(context.mcc) ||
    Boolean(context.gateway)

  if (!hasData) {
    factors.push({
      label: "Contexto de gateway ausente",
      impact: 0,
      reason: "Sem dados de gateway/MCC/valor, o enrichment retorna baseline 10.",
    })
    return { score: 10, factors }
  }

  let score = 10
  const currency = (context.currency ?? "").toUpperCase()
  const mcc = (context.mcc ?? "").trim()

  if (typeof context.amount === "number" && context.amount > 5000 && ["USD", "EUR", "BRL"].includes(currency)) {
    score += 15
    factors.push({
      label: "Valor alto",
      impact: 15,
      reason: `Valor ${context.amount} ${currency} acima de 5000.`,
    })
  }

  if (mcc === "7995" || mcc === "6051") {
    score += 25
    factors.push({
      label: "MCC de alto risco",
      impact: 25,
      reason: `MCC ${mcc} classificado como gambling/crypto.`,
    })
  }

  if (factors.length === 0) {
    factors.push({
      label: "Gateway sem red flags",
      impact: 0,
      reason: "Sem gatilhos de risco alto para valor/MCC.",
    })
  }

  return { score: clamp(score, 0, 100), factors }
}
