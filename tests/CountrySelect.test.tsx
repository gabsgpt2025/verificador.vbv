import { describe, expect, it } from 'vitest'

import { buildCountryOptions } from '@/components/premium-3-0/selects/CountrySelect'
import { filterOptions } from '@/components/premium-3-0/selects/CommandComboBox'

describe('CountrySelect', () => {
  it('busca por sigla e nome', () => {
    const options = buildCountryOptions()
    expect(filterOptions(options, 'br').some((item) => item.value === 'BR')).toBe(true)
    expect(filterOptions(options, 'canad').some((item) => item.value === 'CA')).toBe(true)
  })
})
