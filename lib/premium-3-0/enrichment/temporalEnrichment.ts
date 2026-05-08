import type { BinRiskFactor } from "../types"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function toLocalDate(timestamp: number, timezoneOffset?: number) {
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0
  const offsetMinutes = typeof timezoneOffset === "number" ? timezoneOffset : 0
  return new Date(safeTimestamp - offsetMinutes * 60_000)
}

export function enrichTemporal(timestamp: number, timezoneOffset?: number) {
  const date = toLocalDate(timestamp, timezoneOffset)
  const hour = date.getUTCHours()
  const dayOfWeek = date.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isNightTime = hour >= 22 || hour <= 6
  const isDawn = hour >= 2 && hour <= 5
  const isBusinessHour = !isWeekend && hour >= 9 && hour <= 18
  const factors: BinRiskFactor[] = []
  let score = 15

  if (isDawn) {
    score += 30
    factors.push({
      label: "Transação em madrugada profunda",
      impact: 30,
      reason: "Operações entre 2h e 5h tendem a concentrar mais tentativas suspeitas.",
    })
  } else if (hour >= 22 || hour <= 1) {
    score += 15
    factors.push({
      label: "Transação em horário noturno",
      impact: 15,
      reason: "Operações entre 22h e 1h costumam exigir monitoramento adicional.",
    })
  }

  if (isWeekend) {
    score += 10
    factors.push({
      label: "Fim de semana",
      impact: 10,
      reason: "Finais de semana têm padrão operacional menos previsível para este tipo de análise.",
    })
  }

  if (isBusinessHour) {
    score -= 5
    factors.push({
      label: "Horário comercial em dia útil",
      impact: -5,
      reason: "Operações em horário comercial e dia útil tendem a seguir padrões mais esperados.",
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
    score: clamp(score, 0, 100),
    factors,
  }
}
