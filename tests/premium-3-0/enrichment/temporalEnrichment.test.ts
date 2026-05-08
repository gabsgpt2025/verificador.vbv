import { describe, expect, it } from 'vitest'

import { enrichTemporal } from '@/lib/premium-3-0/enrichment/temporalEnrichment'

describe('enrichTemporal', () => {
  it('marca madrugada com score elevado', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 3, 0, 0))

    expect(result.hour).toBe(3)
    expect(result.isNightTime).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(45)
  })

  it('aplica bônus de fim de semana', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 9, 14, 0, 0))

    expect(result.dayOfWeek).toBe(6)
    expect(result.isWeekend).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(25)
  })

  it('reduz risco em horário comercial de dia útil', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 14, 0, 0))

    expect(result.isWeekend).toBe(false)
    expect(result.score).toBe(10)
  })
})
