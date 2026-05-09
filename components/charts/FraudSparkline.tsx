'use client'

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartContainer } from '@/components/charts/ChartContainer'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

export type FraudPoint = {
  date: string
  value: number
  isToday?: boolean
}

type FraudSparklineProps = {
  points: FraudPoint[] | null
  source?: string | null
  computedAt?: string | null
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function FraudSparkline({
  points,
  source,
  computedAt,
  confidence,
  loading,
  errorMessage,
  onRetry,
}: FraudSparklineProps) {
  const hasSeries = Boolean(points && points.length > 1)
  const sorted = hasSeries ? [...points!].sort((a, b) => a.date.localeCompare(b.date)) : []
  const peak = sorted.reduce<FraudPoint | null>((acc, item) => (!acc || item.value > acc.value ? item : acc), null)
  const today = sorted.find((item) => item.isToday) ?? sorted[sorted.length - 1]

  return (
    <ChartContainer
      title="Histórico de fraude do BIN"
      description="Últimos 90 dias (ou janela disponível)"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={null}
    >
      {!hasSeries ? (
        <div className="rounded-lg border border-dashed border-border-subtle bg-bg-surface p-4 text-sm text-fg-muted">
          Histórico indisponível para este BIN.{' '}
          <a href="#metodologia-historico" className="text-ds-accent underline">
            Por quê?
          </a>
        </div>
      ) : (
        <div className="space-y-3" role="img" aria-label="Sparkline de fraude histórica">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sorted}>
                <defs>
                  <linearGradient id="sparklineArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={28} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value}`, 'Índice de fraude']} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#sparklineArea)" />
                {peak ? <ReferenceDot x={peak.date} y={peak.value} r={4} fill="#ef4444" stroke="none" /> : null}
                {today ? <ReferenceDot x={today.date} y={today.value} r={4} fill="#22c55e" stroke="none" /> : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <ConfidenceBadge value={confidence} />
            <span>Fonte: {source ?? 'não informada'}</span>
            <span>Atualizado em: {computedAt ?? 'não informado'}</span>
          </div>
        </div>
      )}
    </ChartContainer>
  )
}

export default FraudSparkline
