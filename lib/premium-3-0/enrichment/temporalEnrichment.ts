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

  return {
    hour,
    dayOfWeek,
    isWeekend,
    isNightTime,
    isBusinessHours,
  }
}
