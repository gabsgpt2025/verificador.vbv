import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import { Premium3DAnalyzer, buildAnalysisRequestBody } from '@/components/premium-3-0/Premium3DAnalyzer'

function createMockAnalysis(overrides: Record<string, unknown> = {}) {
  const fixedTimestamp = Date.parse('2026-05-09T00:00:00.000Z')
  return {
    holistic: {
      overallScore: 62,
      riskLevel: 'HIGH',
      recommendation: 'REQUIRE_3DS',
      ensembleConfidence: 90,
      sourcesUsed: ['neutrino', 'mastercard'],
      peerComparison: { percentile: 70, description: 'Top 30% de risco.' },
      binRisk: { score: 50, weight: 0.3, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      temporalRisk: { score: 40, weight: 0.1, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      behavioralRisk: { score: 60, weight: 0.15, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      geographicRisk: { score: 70, weight: 0.2, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      deviceRisk: { score: 20, weight: 0.15, dataAvailable: false, factors: [], explanation: { technical: 't', popular: 'p' } },
      gatewayRisk: { score: 35, weight: 0.1, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
    },
    context: {
      amount: 10000,
      currency: 'BRL',
      merchantCountry: 'BR',
      mcc: '5411',
      timestamp: fixedTimestamp,
      ipCountryCode: 'BR',
      userAgentPresent: true,
    },
    technicalData: {
      bin: '411111',
      binLength: 6,
      brand: 'VISA',
      type: 'CREDIT',
      category: 'BLACK',
      countryCode: 'BR',
      countryName: 'Brazil',
      issuer: 'Banco',
      source: 'NEUTRINO',
    },
    threeDSAnalysis: {
      status: 'LIKELY_ACTIVE',
      confidence: 'HIGH',
      challengeLikelihood: 'MEDIUM',
      protocolLikely: 'EMV_3DS_2_2',
      authMethodsLikely: [],
      explanation: { technical: 'ok', popular: 'ok' },
      inferred: true,
      frictionlessProbability: 70,
      challengeProbability: 20,
      bypassProbability: 10,
      applicableBypassMechanisms: [],
    },
    riskAnalysis: {
      score: 40,
      level: 'MEDIUM',
      recommendation: 'REVIEW',
      factors: [],
    },
    compliance: {
      regulatoryRegion: 'BR',
      threeDSMandateLevel: 'MODERATE',
      regulationNote: 'nota',
      complianceRisk: 'LOW',
    },
    dataQuality: {
      score: 90,
      level: 'HIGH',
      missingFields: [],
      inferredFields: [],
      realApiFields: [],
    },
    peerComparison: {
      percentile: 70,
      description: 'Top 30% de risco.',
      peerCount: 120,
    },
    source: {
      provider: 'NEUTRINO',
      rawDataAvailable: true,
      apiConfidence: 'HIGH',
    },
    sources: {
      neutrino: { available: true },
      mastercard: { available: true },
    },
    consensus: {
      countryAgreement: true,
      brandAgreement: true,
      typeAgreement: true,
      confidence: 'HIGH',
      discrepancies: [],
    },
    ...overrides,
  } as any
}

describe('Premium3DAnalyzer smoke', () => {
  it('snapshot do layout de resultado com dados completos', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer as any, { initialAnalysis: createMockAnalysis(), initialHistory: [] }))
    expect(html).toMatchSnapshot()
  })

  it('snapshot do layout com dados parciais', () => {
    const html = renderToStaticMarkup(
      createElement(Premium3DAnalyzer as any, {
        initialAnalysis: createMockAnalysis({
          sources: {
            neutrino: { available: true },
            mastercard: { available: false },
          },
          consensus: {
            countryAgreement: false,
            brandAgreement: true,
            typeAgreement: false,
            confidence: 'MEDIUM',
            discrepancies: ['country mismatch: BR, US'],
          },
        }),
        initialHistory: [],
      }),
    )
    expect(html).toMatchSnapshot()
  })

  it('snapshot do layout sem dados', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer as any, { initialAnalysis: null, initialHistory: [] }))
    expect(html).toMatchSnapshot()
  })

  it('includes optional transaction context in POST body', () => {
    const payload = buildAnalysisRequestBody('411111', {
      amount: '50.00',
      currency: 'USD',
      merchantCountry: 'US',
      mcc: '7995',
      isFirstTransaction: false,
    })

    expect(payload.bin).toBe('411111')
    expect(payload.context.amount).toBe(5000)
    expect(payload.context.currency).toBe('USD')
    expect(payload.context.merchantCountry).toBe('US')
    expect(payload.context.mcc).toBe('7995')
    expect(payload.context.isFirstTransaction).toBe(false)
  })
})
