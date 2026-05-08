import { describe, expect, it } from 'vitest'

import { runHolisticAnalysis } from '@/lib/premium-3-0'
import type { BinApiData } from '@/lib/premium-3-0/types'

function makeBin(overrides: Partial<BinApiData> = {}): BinApiData {
  return {
    bin: '55323000',
    binLength: 8,
    source: 'INTERNAL',
    ...overrides,
  }
}

describe('runHolisticAnalysis', () => {
  it('mantém risco baixo para Bradesco BLACK com IP alinhado e horário comercial', () => {
    const result = runHolisticAnalysis(
      makeBin({
        brand: 'MASTERCARD',
        type: 'CREDIT',
        category: 'BLACK',
        countryCode: 'BR',
        countryName: 'Brazil',
        issuer: 'BRADESCO',
      }),
      {
        amount: 20_000,
        currency: 'BRL',
        ipAddress: '200.147.67.1',
        ipCountryCode: 'BR',
        timestamp: Date.UTC(2026, 4, 11, 14, 0, 0),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/136.0',
        isFirstTransaction: false,
      },
    )

    expect(result.overallScore).toBeLessThan(35)
    expect(result.riskLevel).toBe('LOW')
    expect(result.peerComparison.percentile).toBeGreaterThan(60)
  })

  it('eleva risco para BIN nigeriano pré-pago com IP divergente e madrugada', () => {
    const result = runHolisticAnalysis(
      makeBin({
        bin: '506099',
        binLength: 6,
        brand: 'VISA',
        type: 'PREPAID',
        category: 'VIRTUAL',
        countryCode: 'NG',
        countryName: 'Nigeria',
        issuer: null,
        isPrepaid: true,
        source: 'NEUTRINO',
      }),
      {
        amount: 1_000_000,
        currency: 'BRL',
        ipAddress: '8.8.8.8',
        ipCountryCode: 'US',
        timestamp: Date.UTC(2026, 4, 11, 3, 0, 0),
        userAgent: null,
        isFirstTransaction: true,
      },
    )

    expect(result.geographicRisk.score).toBeGreaterThan(50)
    expect(result.overallScore).toBeGreaterThan(70)
    expect(['HIGH', 'CRITICAL']).toContain(result.riskLevel)
  })

  it('não quebra com BIN desconhecido e explica ausência de dados', () => {
    const result = runHolisticAnalysis(
      makeBin({
        bin: '000000',
        binLength: 6,
        source: 'UNKNOWN',
      }),
      {
        timestamp: 0,
      },
    )

    const allReasons = [
      ...result.binRisk.factors,
      ...result.geographicRisk.factors,
      ...result.behavioralRisk.factors,
    ]
      .map((factor) => `${factor.label} ${factor.reason}`.toLowerCase())
      .join(' ')

    expect(result.riskLevel).toBe('MEDIUM')
    expect(allReasons).toMatch(/insuficient|ausente|desconhecid/)
  })
})
