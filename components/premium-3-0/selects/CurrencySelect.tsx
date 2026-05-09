'use client'

import { ISO_4217_CURRENCIES, ISO_4217_VERSION, TOP_ECOMMERCE_CURRENCIES } from '@/lib/data/iso-4217'

import { CommandComboBox, type ComboOption } from './CommandComboBox'

const topSet = new Set<string>(TOP_ECOMMERCE_CURRENCIES)

export function buildCurrencyOptions() {
  const top = ISO_4217_CURRENCIES.filter((currency) => topSet.has(currency.code))
  const rest = ISO_4217_CURRENCIES.filter((currency) => !topSet.has(currency.code))

  const toOption = (currency: (typeof ISO_4217_CURRENCIES)[number]): ComboOption => ({
    value: currency.code,
    label: `${currency.code} — ${currency.namePtBr}`,
    searchText: `${currency.code} ${currency.namePtBr}`.toLowerCase(),
    meta: topSet.has(currency.code) ? 'Top e-commerce' : ISO_4217_VERSION,
  })

  return [...top.map(toOption), ...rest.map(toOption)]
}

const options = buildCurrencyOptions()

type CurrencySelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
}

export function CurrencySelect({ id, value, onChange }: CurrencySelectProps) {
  return (
    <CommandComboBox
      id={id}
      value={value}
      options={options}
      placeholder="Selecione a moeda"
      searchPlaceholder="Busque por código ou nome (USD, dólar, real...)"
      emptyLabel="Moeda não encontrada"
      sourceLabel={ISO_4217_VERSION}
      onChange={onChange}
    />
  )
}

export default CurrencySelect
