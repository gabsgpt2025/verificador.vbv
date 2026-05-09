'use client'

import { useMemo, useState } from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'

import { ChartContainer } from '@/components/charts/ChartContainer'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

export type RiskRadarDimension = {
  key: 'binRisk' | 'behavioralRisk' | 'geographicRisk' | 'deviceRisk' | 'gatewayRisk' | 'temporalRisk'
  label: string
  score: number
  dataAvailable: boolean
  explanation?: string
}

type RiskRadarProps = {
  dimensions: RiskRadarDimension[]
  medianPeer?: number | null
  source?: string | null
  computedAt?: string | null
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function normalizeRiskRadarDimensions(dimensions: RiskRadarDimension[]) {
  return dimensions.map((dimension) => ({
    ...dimension,
    value: dimension.dataAvailable ? dimension.score : null,
    unavailableLabel: dimension.dataAvailable ? '' : '—',
  }))
}

export function RiskRadar({
  dimensions,
  medianPeer,
  source,
  computedAt,
  confidence,
  loading,
  errorMessage,
  onRetry,
}: RiskRadarProps) {
  const [selectedKey, setSelectedKey] = useState<RiskRadarDimension['key'] | null>(null)

  const normalized = useMemo(() => normalizeRiskRadarDimensions(dimensions), [dimensions])
  const hasData = normalized.some((dimension) => dimension.dataAvailable)
  const selectedDimension = normalized.find((dimension) => dimension.key === selectedKey) ?? normalized[0]
  const simplified = normalized.map((dimension) => ({ ...dimension, value: dimension.dataAvailable ? dimension.score : 0 }))

  return (
    <ChartContainer
      title="Radar multidimensional (6D)"
      description="BIN, Comportamental, Geográfico, Dispositivo, Esquema e Temporal"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={hasData ? null : 'Dimensões de risco indisponíveis para este BIN.'}
      className="h-full"
    >
      <div className="space-y-4" role="group" aria-label="Radar 6 dimensões de risco">
        <div className="hidden h-[320px] w-full sm:block">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={normalized} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="radarFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="hsl(var(--border-subtle))" />
              <PolarAngleAxis dataKey="label" tick={{ fill: 'hsl(var(--fg-muted))', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--fg-muted))', fontSize: 11 }} />
              <Tooltip
                formatter={(value) => (value === null || value === undefined ? ['—', 'Score'] : [`${value}/100`, 'Score'])}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as { label: string; dataAvailable: boolean } | undefined
                  return item ? `${item.label} • ${item.dataAvailable ? 'dado confirmado' : 'dado indisponível'}` : ''
                }}
                contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border-subtle))' }}
              />
              <Radar dataKey="value" stroke="#2563eb" fill="url(#radarFillGradient)" fillOpacity={1} />
              {typeof medianPeer === 'number' ? (
                <Radar
                  dataKey={() => medianPeer}
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeDasharray="4 4"
                />
              ) : null}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 sm:hidden">
          {simplified.map((dimension) => (
            <div key={dimension.key}>
              <div className="flex items-center justify-between text-xs text-fg-muted">
                <span>{dimension.label}</span>
                <span>{dimension.dataAvailable ? `${dimension.score}/100` : '—'}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-bg-surface-elevated">
                <div className="h-2 rounded-full bg-ds-accent" style={{ width: `${dimension.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {normalized.map((dimension) => (
            <button
              key={dimension.key}
              type="button"
              onClick={() => setSelectedKey(dimension.key)}
              className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-left text-xs hover:border-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              {dimension.label}: {dimension.dataAvailable ? `${dimension.score}/100` : '—'}
            </button>
          ))}
        </div>

        {selectedDimension ? (
          <p className="rounded-md bg-bg-surface-elevated p-3 text-xs text-fg-muted">
            {selectedDimension.label}: {selectedDimension.explanation ?? 'Sem detalhes adicionais.'}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <ConfidenceBadge value={confidence} />
          <span>Fonte: {source ?? 'não informada'}</span>
          <span>Atualizado em: {computedAt ?? 'não informado'}</span>
        </div>
      </div>
    </ChartContainer>
  )
}

export default RiskRadar
