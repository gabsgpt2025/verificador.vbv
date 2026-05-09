'use client'

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartContainer } from '@/components/charts/ChartContainer'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

export type PeerDistributionBin = {
  bucket: string
  count: number
}

type PeerComparisonBarProps = {
  percentile: number | null
  distribution: PeerDistributionBin[]
  sampleSize: number
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function toTopPercentage(percentile: number) {
  const bounded = Math.min(Math.max(percentile, 0), 100)
  return Math.max(0, 100 - bounded)
}

export function PeerComparisonBar({
  percentile,
  distribution,
  sampleSize,
  confidence,
  loading,
  errorMessage,
  onRetry,
}: PeerComparisonBarProps) {
  const hasData = typeof percentile === 'number' && distribution.length > 0 && sampleSize > 0
  const topPercentage = typeof percentile === 'number' ? toTopPercentage(percentile) : null

  return (
    <ChartContainer
      title="Posição entre BINs pares"
      description="Distribuição por emissor/segmento"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={hasData ? null : 'Comparação com pares indisponível para este BIN.'}
    >
      <div className="space-y-3" role="img" aria-label="Comparação do BIN com distribuição de pares">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value}`, 'Quantidade de BINs']} />
              <Bar dataKey="count" fill="#2563eb" />
              {typeof percentile === 'number' ? <ReferenceLine x={`${Math.round(percentile)}`} stroke="#ef4444" strokeWidth={2} /> : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {typeof percentile === 'number' ? (
          <p className="text-sm text-fg-muted">
            Este BIN está melhor que {Math.round(percentile)}% dos BINs deste segmento — entre os {Math.round(topPercentage ?? 0)}% mais bem avaliados de{' '}
            {sampleSize} BINs comparáveis.
          </p>
        ) : null}
        <ConfidenceBadge value={confidence} />
      </div>
    </ChartContainer>
  )
}

export default PeerComparisonBar
