import type { BinRiskFactor } from "../types"

/** MCC codes that carry elevated gateway risk */
const HIGH_RISK_MCC = new Set(["7995", "6051"])

const EUR_EXCHANGE_RATE: Record<string, number> = {
  EUR: 1,
  BRL: 0.18,
  USD: 0.92,
  GBP: 1.16,
  CAD: 0.67,
  AUD: 0.6,
  MXN: 0.05,
}

const BRL_EXCHANGE_RATE: Record<string, number> = {
  BRL: 1,
  EUR: 6,
  USD: 5.45,
  GBP: 6.9,
  CAD: 4.0,
  AUD: 3.6,
  MXN: 0.29,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function convertAmountToEur(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = EUR_EXCHANGE_RATE[(currency ?? "EUR").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

function convertAmountToBrl(amountInCents?: number, currency?: string) {
  if (typeof amountInCents !== "number") return null
  const rate = BRL_EXCHANGE_RATE[(currency ?? "BRL").toUpperCase()] ?? 1
  return (amountInCents / 100) * rate
}

export interface GatewayContext {
  amount?: number
  currency?: string
  mcc?: string
  merchantHost?: string
}

export function enrichGateway({ amount, currency, mcc, merchantHost }: GatewayContext) {
  const factors: BinRiskFactor[] = []
  const sourcesUsed: string[] = []

  const hasAmount = typeof amount === "number"
  const hasMcc = typeof mcc === "string" && mcc.length > 0

  if (!hasAmount && !hasMcc && !merchantHost) {
    factors.push({
      label: "Sem dados de contexto do gateway",
      impact: 0,
      reason: "Sem valor de transação, MCC ou host informado, o motor usa score neutro conservador.",
    })
    return { score: 20, factors, dataAvailable: false, hostReputation: null, hostListed: null, hostLists: null, sourcesUsed }
  }

  let score = 30
  const amountInBrl = convertAmountToBrl(amount, currency)
  const amountInEur = convertAmountToEur(amount, currency)
  const hostReputation: number | null = null
  const hostListed: boolean | null = null
  const hostLists: string[] | null = null

  if (hasAmount) {
    factors.push({
      label: "Valor da transação informado",
      impact: 10,
      reason: "Com valor disponível, o motor consegue estimar pressão de risco do gateway e de possíveis isenções.",
    })

    if (amountInBrl !== null && amountInBrl > 5000) {
      score += 20
      factors.push({
        label: "Valor alto para o gateway",
        impact: 20,
        reason: `O valor equivalente em BRL é ${amountInBrl.toFixed(2)}, acima da faixa de R$ 5.000.`,
      })
    }

    if (amountInEur !== null && amountInEur < 30) {
      score -= 5
      factors.push({
        label: "Faixa elegível para isenção de baixo valor",
        impact: -5,
        reason: `O valor equivalente em EUR é ${amountInEur.toFixed(2)}, permitindo leitura de low-value exemption/SCA.`,
      })
    }
  }

  if (hasMcc && HIGH_RISK_MCC.has(mcc)) {
    score += 25
    const mccLabels: Record<string, string> = {
      "7995": "7995 (apostas / jogos de azar)",
      "6051": "6051 (câmbio / quasi-cash)",
    }
    factors.push({
      label: `MCC de alto risco: ${mccLabels[mcc] ?? mcc}`,
      impact: 25,
      reason: `Transações com MCC ${mcc} exigem autenticação reforçada e maior escrutínio do gateway.`,
    })
  } else if (hasMcc) {
    factors.push({
      label: `MCC informado: ${mcc}`,
      impact: 0,
      reason: `O código MCC ${mcc} não está classificado como alto risco nesta base.`,
    })
  }

  if (merchantHost) {
    factors.push({
      label: "Host do merchant informado",
      impact: 0,
      reason: `Host ${merchantHost} recebido no contexto; heurística local aplicada sem consulta externa.`,
    })
  }

  return {
    score: clamp(score, 0, 100),
    factors,
    dataAvailable: true,
    hostReputation,
    hostListed,
    hostLists,
    sourcesUsed,
  }
}
