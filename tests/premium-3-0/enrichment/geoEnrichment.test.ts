import { describe, expect, it } from 'vitest'

import { enrichGeo } from '@/lib/premium-3-0/enrichment/geoEnrichment'

describe('enrichGeo', () => {
  it('retorna match quando BIN e IP estão no mesmo país', () => {
    const result = enrichGeo('BR', {
      ipCountry: 'BR',
      ipCity: 'Sao Paulo',
      ipLatitude: '-23.55',
      ipLongitude: '-46.63',
    })

    expect(result.ipCountry).toBe('BR')
    expect(result.ipCountryMatch).toBe(true)
    expect(result.ipCountryTier).toBe('tier2')
    expect(typeof result.distanceKm === 'number' || result.distanceKm === null).toBe(true)
  })

  it('marca mismatch quando o país do IP diverge', () => {
    const result = enrichGeo('BR', { ipCountry: 'US' })

    expect(result.ipCountryMatch).toBe(false)
    expect(result.ipCountryTier).toBe('tier1')
  })

  it('classifica países críticos corretamente', () => {
    const result = enrichGeo('NG', { ipCountry: 'NG' })

    expect(result.ipCountryTier).toBe('critical')
  })
})
