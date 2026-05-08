import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

import {
  getRadarColor,
  normalizeDimensions,
  RiskRadarChart,
  type RadarDimension,
} from '@/components/premium-3-0/RiskRadarChart'

describe('RiskRadarChart', () => {
  it('normaliza as 6 dimensões e preserva dataAvailable=false', () => {
    const dimensions: RadarDimension[] = [
      { key: 'binRisk', label: 'BIN', score: 10, dataAvailable: true },
      { key: 'geographicRisk', label: 'Geográfico', score: 20, dataAvailable: true },
      { key: 'behavioralRisk', label: 'Comportamental', score: 30, dataAvailable: false },
      { key: 'gatewayRisk', label: 'Gateway', score: 40, dataAvailable: true },
      { key: 'temporalRisk', label: 'Temporal', score: 50, dataAvailable: true },
      { key: 'deviceRisk', label: 'Dispositivo', score: 60, dataAvailable: true },
    ]

    const normalized = normalizeDimensions(dimensions)
    expect(normalized).toHaveLength(6)
    expect(normalized.find((entry) => entry.key === 'behavioralRisk')?.unavailableScore).toBe(30)
    expect(getRadarColor(85)).toBe('#ef4444')
  })

  it('renderiza componente com seis dimensões sem quebrar SSR', () => {
    const html = renderToStaticMarkup(
      createElement(RiskRadarChart, {
        overallScore: 55,
        dimensions: [
          { key: 'binRisk', label: 'BIN', score: 10, dataAvailable: true },
          { key: 'geographicRisk', label: 'Geográfico', score: 20, dataAvailable: true },
          { key: 'behavioralRisk', label: 'Comportamental', score: 30, dataAvailable: false },
          { key: 'gatewayRisk', label: 'Gateway', score: 40, dataAvailable: true },
          { key: 'temporalRisk', label: 'Temporal', score: 50, dataAvailable: true },
          { key: 'deviceRisk', label: 'Dispositivo', score: 60, dataAvailable: true },
        ],
      }),
    )

    expect(html).toContain('width')
  })
})
