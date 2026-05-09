'use client'

import { ISO_3166_COUNTRIES, ISO_3166_VERSION } from '@/lib/data/iso-3166'

import { CommandComboBox, type ComboOption } from './CommandComboBox'

export function buildCountryOptions() {
  return ISO_3166_COUNTRIES.map((country): ComboOption => ({
    value: country.code,
    label: `${country.flag} ${country.namePtBr} — ${country.code}`,
    searchText: `${country.code} ${country.namePtBr}`.toLowerCase(),
    meta: ISO_3166_VERSION,
  }))
}

const options = buildCountryOptions()

type CountrySelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
}

export function CountrySelect({ id, value, onChange }: CountrySelectProps) {
  return (
    <CommandComboBox
      id={id}
      value={value}
      options={options}
      placeholder="Selecione o país do merchant"
      searchPlaceholder="Busque por sigla ou nome (BR, Brasil, Canadá...)"
      emptyLabel="País não encontrado"
      sourceLabel={ISO_3166_VERSION}
      onChange={onChange}
    />
  )
}

export default CountrySelect
