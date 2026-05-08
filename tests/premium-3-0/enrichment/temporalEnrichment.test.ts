import { describe, expect, it } from 'vitest'

import { enrichTemporal } from '@/lib/premium-3-0/enrichment/temporalEnrichment'

describe('enrichTemporal', () => {
  it('marca madrugada como período noturno', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 3, 0, 0))

    expect(result.hour).toBe(3)
    expect(result.isNightTime).toBe(true)
  })

  it('marca fim de semana', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 9, 14, 0, 0))

    expect(result.dayOfWeek).toBe('SATURDAY')
    expect(result.isWeekend).toBe(true)
  })

  it('reconhece horário comercial em dia útil', () => {
    const result = enrichTemporal(Date.UTC(2026, 4, 11, 14, 0, 0))

    expect(result.isWeekend).toBe(false)
    expect(result.isBusinessHours).toBe(true)
  })
})
