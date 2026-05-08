import type { TemporalContext } from "../types"

const DAY_NAMES: TemporalContext["dayOfWeek"][] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]

export function enrichTemporal(timestamp: number): TemporalContext {
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0
  const date = new Date(safeTimestamp)
  const hour = date.getUTCHours()
  const dayOfWeek = DAY_NAMES[date.getUTCDay()]

  const isWeekend = dayOfWeek === "SATURDAY" || dayOfWeek === "SUNDAY"
  const isNightTime = hour < 6 || hour >= 22
  const isBusinessHours = !isWeekend && hour >= 9 && hour < 18
  const factors = []
  let score = 15

  if (isNightTime) {
    score += 25
    factors.push({
      label: "Período noturno",
      impact: 25,
      reason: "Transações entre 22h e 6h recebem ajuste conservador de risco temporal.",
    })
  }

  if (isWeekend) {
    score += 10
    factors.push({
      label: "Fim de semana",
      impact: 10,
      reason: "Fins de semana concentram padrões menos previsíveis de consumo.",
    })
  }

  if (isBusinessHours) {
    score -= 10
    factors.push({
      label: "Horário comercial",
      impact: -10,
      reason: "Compras em horário comercial tendem a ser mais previsíveis.",
    })
  }

  return {
    hour,
    dayOfWeek,
    isWeekend,
    isNightTime,
    isBusinessHours,
    score: Math.max(0, Math.min(100, score)),
    factors,
  }
}
