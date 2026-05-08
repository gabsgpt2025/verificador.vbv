import { describe, expect, it } from 'vitest'

import { calculateBankRisk, getBankReputation, normalizeIssuerName } from '@/lib/premium-3-0/enrichment/bankReputation'

describe('normalizeIssuerName', () => {
  it('converte para uppercase e remove espaços extras', () => {
    expect(normalizeIssuerName('  bradesco  ')).toBe('BRADESCO')
    expect(normalizeIssuerName('banco do brasil s.a.')).toBe('BANCO DO BRASIL S.A.')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(normalizeIssuerName(null)).toBe('')
    expect(normalizeIssuerName(undefined)).toBe('')
  })
})

describe('getBankReputation', () => {
  it('encontra o Bradesco pelo nome exato', () => {
    const rep = getBankReputation('BRADESCO')
    expect(rep).not.toBeNull()
    expect(rep?.tier).toBe('TIER1')
  })

  it('retorna null para emissor desconhecido', () => {
    const rep = getBankReputation('BANCO XYZ DESCONHECIDO')
    expect(rep).toBeNull()
  })

  it('retorna null para string vazia', () => {
    const rep = getBankReputation('')
    expect(rep).toBeNull()
  })

  it('encontra Nubank na base', () => {
    const rep = getBankReputation('NUBANK')
    expect(rep).not.toBeNull()
    expect(rep?.approvalRate).toBeGreaterThan(0.8)
  })
})

describe('calculateBankRisk', () => {
  it('usa score neutro 30 para emissor desconhecido', () => {
    const result = calculateBankRisk('UNKNOWN BANK XYZ')
    expect(result.score).toBe(30)
    expect(result.factors.some((f) => f.label.toLowerCase().includes('base'))).toBe(true)
  })

  it('retorna score baixo para banco TIER1 com alta aprovação', () => {
    const result = calculateBankRisk('BRADESCO')
    expect(result.score).toBeLessThan(30)
  })

  it('usa score neutro 30 para issuer null', () => {
    const result = calculateBankRisk(null)
    expect(result.score).toBe(30)
  })
})
