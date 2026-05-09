import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RiskGauge, resolveRiskGaugeZone } from '@/components/charts/RiskGauge'

describe('RiskGauge', () => {
  it('resolve zona corretamente por score', () => {
    expect(resolveRiskGaugeZone(15)).toBe('LOW')
    expect(resolveRiskGaugeZone(45)).toBe('MEDIUM')
    expect(resolveRiskGaugeZone(78)).toBe('HIGH')
    expect(resolveRiskGaugeZone(95)).toBe('CRITICAL')
  })

  it('renderiza aria-label de gauge', () => {
    const html = renderToStaticMarkup(
      createElement(RiskGauge, {
        score: 42,
        confirmedSources: 2,
        totalSources: 3,
        source: 'Neutrino',
        computedAt: '2026-05-08T00:00:00.000Z',
        confidence: { level: 'VERIFIED', source: 'Neutrino' },
      }),
    )
    expect(html).toContain('aria-label="Gauge de risco 42/100"')
  })

  it('mostra estado empty quando score não existe', () => {
    const html = renderToStaticMarkup(
      createElement(RiskGauge, {
        score: null,
        confirmedSources: 0,
        totalSources: 3,
        confidence: { level: 'UNAVAILABLE' },
      }),
    )
    expect(html).toContain('Score indisponível para este BIN no momento.')
  })
})
