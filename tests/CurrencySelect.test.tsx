import { describe, expect, it } from 'vitest'

import { buildCurrencyOptions } from '@/components/premium-3-0/selects/CurrencySelect'
import { filterOptions } from '@/components/premium-3-0/selects/CommandComboBox'

describe('CurrencySelect', () => {
  it('busca por código e nome', () => {
    const options = buildCurrencyOptions()
    expect(filterOptions(options, 'USD').some((item) => item.value === 'USD')).toBe(true)
    expect(filterOptions(options, 'real').some((item) => item.value === 'BRL')).toBe(true)
  })

  it('mantém top moedas no topo', () => {
    const options = buildCurrencyOptions()
    const firstTen = options.slice(0, 10).map((item) => item.value)
    expect(firstTen).toEqual(expect.arrayContaining(['USD', 'EUR', 'BRL']))
  })
})
