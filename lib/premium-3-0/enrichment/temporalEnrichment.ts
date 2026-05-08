import type { BinRiskFactor } from "../types"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

export function enrichTemporal(timestamp: number) {
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0
  const date = new Date(safeTimestamp)
  const hour = date.getUTCHours()
  const dayOfWeek = date.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isNightTime = hour >= 0 && hour <= 6
  const isBusinessHour = !isWeekend && hour >= 9 && hour <= 18
  const isFridayOrSaturdayNight = (dayOfWeek === 5 || dayOfWeek === 6) && hour >= 18
  const factors: BinRiskFactor[] = []
  let score = 30
  let label = "NEUTRAL"

  if (hour >= 0 && hour <= 5) {
    score += 25
    label = "LATE_NIGHT"
    factors.push({
      label: "Madrugada (00h–05h)",
      impact: 25,
      reason: "Transações de madrugada têm maior incidência histórica de tentativas suspeitas.",
    })
  }

  if (isFridayOrSaturdayNight) {
    score += 15
    label = "WEEKEND_NIGHT"
    factors.push({
      label: "Noite de sexta/sábado",
      impact: 15,
      reason: "Sexta e sábado à noite elevam volatilidade de risco transacional.",
    })
  }

  if (isBusinessHour) {
    score = 10
    label = "BUSINESS_HOURS"
    factors.push({
      label: "Dia útil em horário comercial",
      impact: -20,
      reason: "Horário comercial em dia útil usa baseline de risco temporal reduzido.",
    })
  }

  if (factors.length === 0) {
    factors.push({
      label: "Janela temporal neutra",
      impact: 0,
      reason: "O horário informado não ativa bônus nem alertas temporais relevantes.",
    })
  }

  return {
    hour,
    dayOfWeek,
    isWeekend,
    isNightTime,
    label,
    score: clamp(score, 0, 100),
    factors,
  }
}
