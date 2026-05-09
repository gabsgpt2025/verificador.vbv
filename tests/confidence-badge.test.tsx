import { describe, expect, it } from 'vitest'

import { resolveConfidenceBadge } from '@/components/ui/ConfidenceBadge'

describe('ConfidenceBadge', () => {
  it('não permite Verificado sem source', () => {
    const badge = resolveConfidenceBadge({ level: 'VERIFIED', source: null })
    expect(badge.level).toBe('UNAVAILABLE')
  })
})
