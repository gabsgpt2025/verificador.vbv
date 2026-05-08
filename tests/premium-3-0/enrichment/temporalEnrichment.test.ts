import { describe, expect, it } from "vitest"

import { enrichTemporal } from "@/lib/premium-3-0/enrichment/temporalEnrichment"

describe("enrichTemporal", () => {
  it("aplica +25 na madrugada (00-05h)", () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 3, 0, 0))
    expect(result.hour).toBe(3)
    expect(result.score).toBeGreaterThanOrEqual(55)
    expect(result.label).toBe("LATE_NIGHT")
  })

  it("aplica +15 para sexta/sábado à noite", () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 9, 20, 0, 0))
    expect(result.dayOfWeek).toBe(6)
    expect(result.score).toBeGreaterThanOrEqual(45)
    expect(result.label).toBe("WEEKEND_NIGHT")
  })

  it("força baseline 10 em dia útil 9-18h", () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 14, 0, 0))
    expect(result.isWeekend).toBe(false)
    expect(result.score).toBe(10)
    expect(result.label).toBe("BUSINESS_HOURS")
  })
})
