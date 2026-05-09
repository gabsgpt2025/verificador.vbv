import { describe, expect, it } from 'vitest'

import { buildMccOptions, HIGH_RISK_MCC } from '@/components/premium-3-0/selects/MccSelect'
import { filterOptions } from '@/components/premium-3-0/selects/CommandComboBox'

describe('MccSelect', () => {
  it('busca por código e palavra-chave', () => {
    const options = buildMccOptions()
    expect(filterOptions(options, '5411').some((item) => item.value === '5411')).toBe(true)
    expect(filterOptions(options, 'gambling').some((item) => item.value === '7995')).toBe(true)
  })

  it('marca MCC de alto risco', () => {
    expect(HIGH_RISK_MCC.has('7995')).toBe(true)
    expect(HIGH_RISK_MCC.has('6051')).toBe(true)
  })
})
