import { describe, expect, it } from 'vitest'

import { getRiskLevel } from '@/lib/risk'

describe('getRiskLevel', () => {
  it('classifies score thresholds correctly', () => {
    expect(getRiskLevel(-1)).toBe('low')
    expect(getRiskLevel(20)).toBe('low')
    expect(getRiskLevel(21)).toBe('medium')
    expect(getRiskLevel(50)).toBe('medium')
    expect(getRiskLevel(51)).toBe('high')
    expect(getRiskLevel(75)).toBe('high')
    expect(getRiskLevel(76)).toBe('critical')
    expect(getRiskLevel(1000)).toBe('critical')
  })
})
