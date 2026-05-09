import { describe, expect, it } from 'vitest'

import { normalizeRiskRadarDimensions } from '@/components/charts/RiskRadar'

describe('RiskRadar', () => {
  it('eixo sem dado não vira 0', () => {
    const normalized = normalizeRiskRadarDimensions([
      { key: 'binRisk', label: 'BIN', score: 30, dataAvailable: true },
      { key: 'behavioralRisk', label: 'Comportamental', score: 65, dataAvailable: false },
      { key: 'geographicRisk', label: 'Geográfico', score: 22, dataAvailable: true },
      { key: 'deviceRisk', label: 'Dispositivo', score: 14, dataAvailable: true },
      { key: 'gatewayRisk', label: 'Esquema', score: 8, dataAvailable: true },
      { key: 'temporalRisk', label: 'Temporal', score: 12, dataAvailable: true },
    ])

    const behavioral = normalized.find((item) => item.key === 'behavioralRisk')
    expect(behavioral?.value).toBeNull()
    expect(behavioral?.unavailableLabel).toBe('—')
  })
})
