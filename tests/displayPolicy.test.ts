import { describe, expect, it } from 'vitest'

import { getScoreDisplayPolicy } from '@/lib/scoring/displayPolicy'

describe('displayPolicy', () => {
  it('confidence LOW nunca exibe score exato', () => {
    const output = getScoreDisplayPolicy({
      score: 49,
      confidence: 'low',
      sourcesConfirmed: 1,
      sourcesTotal: 3,
    })

    expect(output.precision).not.toBe('exact')
    expect(output.displayValue).not.toContain('/100')
  })

  it('confidence HIGH exibe valor exato', () => {
    const output = getScoreDisplayPolicy({
      score: 49,
      confidence: 'high',
      sourcesConfirmed: 3,
      sourcesTotal: 3,
    })

    expect(output.precision).toBe('exact')
    expect(output.displayValue).toBe('49/100')
  })
})
