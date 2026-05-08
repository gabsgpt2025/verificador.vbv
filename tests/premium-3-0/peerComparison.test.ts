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
  it('retorna percentil entre 1 e 99', () => {
    const result = computePeerComparison(makeBin({ countryCode: 'BR', brand: 'MASTERCARD' }))
    expect(result.percentile).toBeGreaterThanOrEqual(1)
    expect(result.percentile).toBeLessThanOrEqual(99)
  })

  it('cartão TIER1 tem percentil maior que CRITICAL', () => {
    const tier1Result = computePeerComparison(makeBin({ countryCode: 'US', brand: 'VISA' }))
    const criticalResult = computePeerComparison(makeBin({ countryCode: 'NG', brand: 'VISA' }))
    expect(tier1Result.percentile).toBeGreaterThan(criticalResult.percentile)
  })

  it('cartão pré-pago tem percentil menor que cartão crédito standard do mesmo país', () => {
    const standardResult = computePeerComparison(makeBin({ countryCode: 'BR', brand: 'VISA' }))
    const prepaidResult = computePeerComparison(makeBin({ countryCode: 'BR', brand: 'VISA', isPrepaid: true }))
    expect(prepaidResult.percentile).toBeLessThan(standardResult.percentile)
  })

  it('inclui descrição textual adequada ao percentil', () => {
    const result = computePeerComparison(makeBin({ countryCode: 'US', brand: 'MASTERCARD', category: 'BLACK' }))
    expect(typeof result.description).toBe('string')
    expect(result.description.length).toBeGreaterThan(0)
  })
})
