import type { TransactionContextFormValue } from '@/components/premium-3-0/TransactionContextForm'

export type BinAutofillInput = {
  context: TransactionContextFormValue
  issuerCountryCode?: string | null
  issuerCurrencyCode?: string | null
  userEditedCurrency: boolean
  userEditedMerchantCountry: boolean
}

export function applyBinAutofill(input: BinAutofillInput) {
  const next = { ...input.context }
  let currencySuggested = false
  let merchantCountrySuggested = false

  const suggestedCurrency = input.issuerCurrencyCode?.trim().toUpperCase()
  const suggestedCountry = input.issuerCountryCode?.trim().toUpperCase()

  if (suggestedCurrency && (!next.currency || !input.userEditedCurrency)) {
    next.currency = suggestedCurrency
    currencySuggested = true
  }

  if (suggestedCountry && (!next.merchantCountry || !input.userEditedMerchantCountry)) {
    next.merchantCountry = suggestedCountry
    merchantCountrySuggested = true
  }

  return {
    value: next,
    suggestedCurrency,
    suggestedMerchantCountry: suggestedCountry,
    currencySuggested,
    merchantCountrySuggested,
  }
}
