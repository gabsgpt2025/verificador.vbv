import { describe, expect, it } from 'vitest'

import { computePeerComparison } from '@/lib/premium-3-0/peerComparison'
import type { BinApiData } from '@/lib/premium-3-0/types'

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: '411111',
    binLength: 6,
    source: 'NEUTRINO',
    ...overrides,
  }
}

describe('computePeerComparison', () => {
  // Sem Supabase, usa fallback heurístico (dataSource: HEURISTIC_ESTIMATE)
  it('retorna percentil entre 1 e 99', async () => {
    const result = await computePeerComparison(makeBin({ countryCode: 'BR', brand: 'MASTERCARD' }))
    expect(result.percentile).toBeGreaterThanOrEqual(1)
    expect(result.percentile).toBeLessThanOrEqual(99)
  })

  it('cartão TIER1 tem percentil maior que CRITICAL', async () => {
    const tier1Result = await computePeerComparison(makeBin({ countryCode: 'US', brand: 'VISA' }))
    const criticalResult = await computePeerComparison(makeBin({ countryCode: 'NG', brand: 'VISA' }))
    expect(tier1Result.percentile).toBeGreaterThan(criticalResult.percentile)
  })

  it('cartão pré-pago tem percentil menor que cartão crédito standard do mesmo país', async () => {
    const standardResult = await computePeerComparison(makeBin({ countryCode: 'BR', brand: 'VISA' }))
    const prepaidResult = await computePeerComparison(makeBin({ countryCode: 'BR', brand: 'VISA', isPrepaid: true }))
    expect(prepaidResult.percentile).toBeLessThan(standardResult.percentile)
  })

  it('inclui descrição textual adequada ao percentil', async () => {
    const result = await computePeerComparison(makeBin({ countryCode: 'US', brand: 'MASTERCARD', category: 'BLACK' }))
    expect(typeof result.description).toBe('string')
    expect(result.description.length).toBeGreaterThan(0)
  })

  it('sem supabase, retorna dataSource HEURISTIC_ESTIMATE', async () => {
    const result = await computePeerComparison(makeBin({ countryCode: 'US' }))
    expect(result.dataSource).toBe('HEURISTIC_ESTIMATE')
    expect(result.peerCount).toBe(0)
  })

  it('riskScore baixo melhora o percentil heurístico', async () => {
    const lowRisk = await computePeerComparison(makeBin({ countryCode: 'US', brand: 'VISA' }), null, 20)
    const highRisk = await computePeerComparison(makeBin({ countryCode: 'US', brand: 'VISA' }), null, 80)
    expect(lowRisk.percentile).toBeGreaterThan(highRisk.percentile)
  })
})
