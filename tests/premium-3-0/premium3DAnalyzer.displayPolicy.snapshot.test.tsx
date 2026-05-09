import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import { Premium3DAnalyzer } from '@/components/premium-3-0/Premium3DAnalyzer'

function makeAnalysis(confirmed: number, total: number) {
  return {
    bin: '411111',
    holistic: {
      overallScore: 49,
      riskLevel: 'MEDIUM',
      recommendation: 'REVIEW',
      ensembleConfidence: 70,
      sourcesUsed: ['neutrino'],
      peerComparison: { percentile: 50, description: 'Na média.' },
      binRisk: { score: 50, weight: 0.3, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      temporalRisk: { score: 40, weight: 0.1, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      behavioralRisk: { score: 60, weight: 0.15, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      geographicRisk: { score: 70, weight: 0.2, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      deviceRisk: { score: 20, weight: 0.15, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
      gatewayRisk: { score: 35, weight: 0.1, dataAvailable: true, factors: [], explanation: { technical: 't', popular: 'p' } },
    },
    context: { timestamp: Date.now(), userAgentPresent: true },
    technicalData: { bin: '411111', binLength: 6, source: 'NEUTRINO', countryCode: 'US', countryName: 'Estados Unidos', currency: 'USD', issuer: 'Issuer' },
    threeDSAnalysis: {
      status: 'UNKNOWN',
      confidence: 'LOW',
      challengeLikelihood: 'MEDIUM',
      protocolLikely: 'EMV_3DS_2',
      authMethodsLikely: [],
      explanation: { technical: 't', popular: 'p' },
      inferred: true,
      frictionlessProbability: 40,
      challengeProbability: 60,
      bypassProbability: 25,
      applicableBypassMechanisms: [],
    },
    riskAnalysis: { score: 49, level: 'MEDIUM', recommendation: 'REVIEW', factors: [] },
    compliance: { regulatoryRegion: 'GLOBAL', threeDSMandateLevel: 'MODERATE', regulationNote: 'ok', complianceRisk: 'LOW' },
    dataQuality: { score: 90, level: 'HIGH', missingFields: [], realApiFields: [], inferredFields: [] },
    finalSummary: { title: 'ok', message: 'ok', action: 'ok' },
    sources: {
      neutrino: { available: confirmed > 0 },
      mastercard: { available: confirmed > 1 },
      binlist: { available: confirmed > 2 },
    },
    consensus: {
      countryAgreement: true,
      brandAgreement: true,
      typeAgreement: true,
      confidence: confirmed >= 3 ? 'HIGH' : confirmed === 2 ? 'MEDIUM' : 'LOW',
      discrepancies: [],
      sourcesConfirmed: confirmed,
      sourcesTotal: total,
    },
    sourceDiagnostics: [],
  } as any
}

describe('Premium3DAnalyzer snapshots', () => {
  it('alta confiança', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer as any, { initialAnalysis: makeAnalysis(3, 3), initialHistory: [] }))
    expect(html).toMatchSnapshot()
  })

  it('baixa confiança', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer as any, { initialAnalysis: makeAnalysis(1, 3), initialHistory: [] }))
    expect(html).toMatchSnapshot()
  })

  it('motor degradado total', () => {
    const html = renderToStaticMarkup(createElement(Premium3DAnalyzer as any, { initialAnalysis: makeAnalysis(0, 3), initialHistory: [] }))
    expect(html).toMatchSnapshot()
  })
})
