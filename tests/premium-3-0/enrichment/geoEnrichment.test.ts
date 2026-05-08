import { describe, expect, it } from 'vitest'

import { enrichGeo } from '@/lib/premium-3-0/enrichment/geoEnrichment'

describe('enrichGeo', () => {
  it('reduz score quando BIN e IP estão no mesmo país', () => {
    const result = enrichGeo('BR', '200.147.67.1', 'BR')

    expect(result.ipCountryCode).toBe('BR')
    expect(result.ipCountryMatch).toBe(true)
    expect(result.countryRiskTier).toBe('TIER1')
    expect(result.score).toBeLessThanOrEqual(15)
  })

  it('aumenta score quando o país do IP diverge sem mascaramento conhecido', () => {
    const result = enrichGeo('BR', '8.8.8.8', 'US')

    expect(result.ipCountryMatch).toBe(false)
    expect(result.score).toBeGreaterThanOrEqual(40)
    expect(result.factors.some((factor) => factor.label.includes('difere'))).toBe(true)
  })

  it('classifica países críticos corretamente', () => {
    const result = enrichGeo('NG', '8.8.8.8', 'US')

    expect(result.countryRiskTier).toBe('CRITICAL')
    expect(result.score).toBeGreaterThanOrEqual(80)
  })
})
