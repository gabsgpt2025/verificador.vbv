import { describe, expect, it } from 'vitest'

import { applyBinAutofill } from '@/lib/scoring/autofill'

describe('autofill', () => {
  it('pré-preenche moeda e país com dados da Neutrino', () => {
    const result = applyBinAutofill({
      context: {
        amount: '',
        currency: '',
        merchantCountry: '',
        mcc: '',
        isFirstTransaction: true,
      },
      issuerCountryCode: 'US',
      issuerCurrencyCode: 'USD',
      userEditedCurrency: false,
      userEditedMerchantCountry: false,
    })

    expect(result.value.currency).toBe('USD')
    expect(result.value.merchantCountry).toBe('US')
    expect(result.currencySuggested).toBe(true)
    expect(result.merchantCountrySuggested).toBe(true)
  })
})
