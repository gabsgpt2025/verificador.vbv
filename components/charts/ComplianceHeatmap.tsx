'use client'

import { ChartContainer } from '@/components/charts/ChartContainer'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

export type ComplianceStatus = 'verified' | 'partial' | 'not_applicable' | 'non_compliant'

export type ComplianceRow = {
  framework: 'PCI-DSS 4.0' | 'LGPD' | '3DS 2.2' | 'EMV 3DS' | 'PSD2 SCA' | 'Bacen Resolução X'
  status: ComplianceStatus
  lastCheckedAt?: string | null
  evidenceUrl?: string | null
  verifiedBy?: string | null
  source?: string | null
}

export function resolveComplianceStatus(row: ComplianceRow): ComplianceStatus {
  if (row.status === 'verified' && !row.evidenceUrl && !row.verifiedBy) {
    return 'partial'
  }

  return row.status
}

const STATUS_STYLE: Record<ComplianceStatus, { label: string; icon: string; className: string }> = {
  verified: { label: 'Verificado', icon: '✅', className: 'bg-primary/15 text-primary' },
  partial: { label: 'Parcial/desatualizado', icon: '🟡', className: 'bg-risk-medium/15 text-risk-medium' },
  not_applicable: { label: 'Não aplicável/sem dado', icon: '⚪', className: 'bg-bg-surface-elevated text-fg-muted' },
  non_compliant: { label: 'Não conforme', icon: '❌', className: 'bg-destructive/15 text-destructive' },
}

type ComplianceHeatmapProps = {
  rows: ComplianceRow[]
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function ComplianceHeatmap({ rows, confidence, loading, errorMessage, onRetry }: ComplianceHeatmapProps) {
  return (
    <ChartContainer
      title="Semáforo de compliance"
      description="Status regulatório com evidência e última verificação"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={rows.length > 0 ? null : 'Sem registros de compliance para exibir.'}
      className="h-full"
    >
      <div className="space-y-3" role="table" aria-label="Tabela de compliance">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
          <p className="text-xs font-semibold text-fg-muted">Framework</p>
          <p className="text-xs font-semibold text-fg-muted">Status</p>
          <p className="text-xs font-semibold text-fg-muted">Última verificação</p>
          <p className="text-xs font-semibold text-fg-muted">Fonte/evidência</p>
        </div>
        {rows.map((row) => {
          const safeStatus = resolveComplianceStatus(row)
          const status = STATUS_STYLE[safeStatus]

          return (
            <div key={row.framework} className="grid grid-cols-1 gap-2 rounded-lg border border-border-subtle p-3 sm:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
              <p className="text-sm">{row.framework}</p>
              <p className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>
                {status.icon} {status.label}
              </p>
              <p className="text-xs text-fg-muted">{row.lastCheckedAt ?? 'não informado'}</p>
              <p className="text-xs text-fg-muted">
                {row.evidenceUrl ? (
                  <a href={row.evidenceUrl} target="_blank" rel="noreferrer" className="text-ds-accent underline">
                    Evidência
                  </a>
                ) : (
                  row.verifiedBy ?? row.source ?? 'sem evidência'
                )}
              </p>
            </div>
          )
        })}
        <ConfidenceBadge value={confidence} />
      </div>
    </ChartContainer>
  )
}

export default ComplianceHeatmap
