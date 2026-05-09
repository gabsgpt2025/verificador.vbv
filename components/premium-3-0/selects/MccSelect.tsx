'use client'

import { MCC_CODES, MCC_DATASET_VERSION } from '@/lib/data/mcc-codes'

import { CommandComboBox, type ComboOption } from './CommandComboBox'

const REQUIRED_MCC = [
  { code: '5411', descriptionPtBr: 'Supermercados / Mercearias', descriptionEn: 'Grocery Stores, Supermarkets', parentCategory: 'Varejo essencial', highRisk: false },
  { code: '5812', descriptionPtBr: 'Restaurantes e alimentação', descriptionEn: 'Eating Places and Restaurants', parentCategory: 'Alimentação', highRisk: false },
  { code: '7995', descriptionPtBr: 'Apostas, loterias e jogos', descriptionEn: 'Betting, lottery and casino', parentCategory: 'Gambling/Cripto', highRisk: true },
  { code: '6051', descriptionPtBr: 'Compra de moeda/cripto', descriptionEn: 'Quasi cash, crypto and foreign currency', parentCategory: 'Gambling/Cripto', highRisk: true },
]

const mergedCodes = [...REQUIRED_MCC, ...MCC_CODES.filter((code) => !REQUIRED_MCC.some((required) => required.code === code.code))]

export const HIGH_RISK_MCC = new Set(mergedCodes.filter((item) => item.highRisk).map((item) => item.code))

export function buildMccOptions() {
  return mergedCodes.map((mcc): ComboOption => ({
    value: mcc.code,
    label: `${mcc.code} — ${mcc.descriptionPtBr}`,
    searchText: `${mcc.code} ${mcc.descriptionPtBr} ${mcc.descriptionEn} ${mcc.parentCategory}`.toLowerCase(),
    meta: `${mcc.parentCategory}${mcc.highRisk ? ' · alto risco' : ''}`,
    group: mcc.parentCategory,
    highRisk: mcc.highRisk,
  }))
}

const options = buildMccOptions()

type MccSelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
}

export function MccSelect({ id, value, onChange }: MccSelectProps) {
  return (
    <CommandComboBox
      id={id}
      value={value}
      options={options}
      placeholder="Selecione o MCC"
      searchPlaceholder="Busque por código ou palavra-chave (5411, mercado, hotel...)"
      emptyLabel="MCC não encontrado"
      sourceLabel={MCC_DATASET_VERSION}
      onChange={onChange}
    />
  )
}

export default MccSelect
