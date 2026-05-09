'use client'

import { useMemo, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { ChartContainer } from '@/components/charts/ChartContainer'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

export type ScoreCompositionEntry = {
  key: string
  label: string
  weight: number
  visible?: boolean
}

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#22c55e', '#f97316', '#ef4444']

type ScoreCompositionProps = {
  entries: ScoreCompositionEntry[]
  rulesetVersion: string
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function ScoreComposition({
  entries,
  rulesetVersion,
  confidence,
  loading,
  errorMessage,
  onRetry,
}: ScoreCompositionProps) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([])
  const [activeLabel, setActiveLabel] = useState<string>('Passe o mouse em uma dimensão')

  const data = useMemo(
    () =>
      entries
        .filter((entry) => !hiddenKeys.includes(entry.key))
        .map((entry) => ({ ...entry, value: Math.round(entry.weight * 100) })),
    [entries, hiddenKeys],
  )
  const hasData = data.length > 0

  return (
    <ChartContainer
      title="Composição do score"
      description="Peso de cada dimensão na pontuação final"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={hasData ? null : 'Composição indisponível para esta análise.'}
    >
      <div className="space-y-3" role="img" aria-label="Gráfico de rosca da composição do score">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                nameKey="label"
                onMouseEnter={(_, index) => setActiveLabel(data[index]?.label ?? '')}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, 'Peso']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-sm font-medium">{activeLabel}</p>
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="rounded-full border border-border-subtle px-3 py-1 text-xs hover:border-ds-accent"
              onClick={() =>
                setHiddenKeys((current) => (current.includes(entry.key) ? current.filter((item) => item !== entry.key) : [...current, entry.key]))
              }
            >
              {hiddenKeys.includes(entry.key) ? 'Mostrar' : 'Ocultar'} {entry.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <ConfidenceBadge value={confidence} />
          <span>Pesos definidos em ruleset {rulesetVersion}</span>
        </div>
      </div>
    </ChartContainer>
  )
}

export default ScoreComposition
