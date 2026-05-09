import { describe, expect, it } from 'vitest'

import { getScoreDisplayPolicy } from '@/lib/scoring/displayPolicy'

describe('degradation-banner logic', () => {
  it('modo parcial quando sourcesConfirmed < sourcesTotal', () => {
    const output = getScoreDisplayPolicy({
      score: 40,
      confidence: 'low',
      sourcesConfirmed: 1,
      sourcesTotal: 3,
    })

    expect(output.warning).toContain('Estimativa preliminar')
  })
})
