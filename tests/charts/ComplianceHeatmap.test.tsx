import { describe, expect, it } from 'vitest'

import { resolveComplianceStatus, type ComplianceRow } from '@/components/charts/ComplianceHeatmap'

describe('ComplianceHeatmap', () => {
  it('não mantém verde sem evidenceUrl ou verifiedBy', () => {
    const row: ComplianceRow = {
      framework: 'PCI-DSS 4.0',
      status: 'verified',
      source: 'auditoria',
    }

    expect(resolveComplianceStatus(row)).toBe('partial')
  })

  it('mantém verde com evidência real', () => {
    const row: ComplianceRow = {
      framework: 'PCI-DSS 4.0',
      status: 'verified',
      evidenceUrl: 'https://example.com/evidence',
    }

    expect(resolveComplianceStatus(row)).toBe('verified')
  })
})
