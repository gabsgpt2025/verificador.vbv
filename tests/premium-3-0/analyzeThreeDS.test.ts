import { describe, expect, it } from 'vitest'

import { analyzeThreeDS, analyzeThreeDSExtended } from '@/lib/premium-3-0/analyzeThreeDS'
import type { BinApiData } from '@/lib/premium-3-0/types'

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: '411111',
    binLength: 6,
    source: 'NEUTRINO',
    brand: 'VISA',
    countryCode: 'US',
    ...overrides,
  }
}

describe('analyzeThreeDS', () => {
  it('retorna frictionlessProbability e challengeProbability somando ≤ 200', () => {
    const result = analyzeThreeDS(makeBin())
    expect(result.frictionlessProbability).toBeGreaterThanOrEqual(0)
    expect(result.frictionlessProbability).toBeLessThanOrEqual(100)
    expect(result.challengeProbability).toBeGreaterThanOrEqual(0)
    expect(result.challengeProbability).toBeLessThanOrEqual(100)
  })

  it('pré-pago reduz frictionlessProbability', () => {
    const normalResult = analyzeThreeDS(makeBin())
    const prepaidResult = analyzeThreeDS(makeBin({ isPrepaid: true, type: 'PREPAID' }))
    expect(prepaidResult.frictionlessProbability).toBeLessThan(normalResult.frictionlessProbability)
  })

  it('cartão CRITICAL country tem frictionless mais baixo que TIER1', () => {
    const tier1Result = analyzeThreeDS(makeBin({ countryCode: 'US' }))
    const criticalResult = analyzeThreeDS(makeBin({ countryCode: 'NG' }))
    expect(criticalResult.frictionlessProbability).toBeLessThan(tier1Result.frictionlessProbability)
  })
})

describe('analyzeThreeDSExtended', () => {
  it('retorna frictionlessProbability, bypassProbability e bypassMechanisms', () => {
    const result = analyzeThreeDSExtended(makeBin())
    expect(result).toHaveProperty('frictionlessProbability')
    expect(result).toHaveProperty('bypassProbability')
    expect(result).toHaveProperty('bypassMechanisms')
    expect(Array.isArray(result.bypassMechanisms)).toBe(true)
  })

  it('valor baixo (< EUR 30) inclui SCA_EXEMPTION_LOW_VALUE em bypassMechanisms', () => {
    // 1000 cents USD = USD 10 ≈ EUR 9.2 < 30
    const result = analyzeThreeDSExtended(makeBin(), { amount: 1_000, currency: 'USD' })
    expect(result.bypassMechanisms).toContain('SCA_EXEMPTION_LOW_VALUE')
  })

  it('não quebra com BIN vazio e retorna tipos corretos', () => {
    const result = analyzeThreeDSExtended(makeBin({ brand: undefined, countryCode: undefined }))
    expect(typeof result.frictionlessProbability).toBe('number')
    expect(typeof result.bypassProbability).toBe('number')
    expect(Array.isArray(result.bypassMechanisms)).toBe(true)
  })
})
