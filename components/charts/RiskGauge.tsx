'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfidenceBadge, type ConfidenceBadgeInput } from '@/components/ui/ConfidenceBadge'

import { ChartContainer } from '@/components/charts/ChartContainer'

export type RiskGaugeZone = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export function resolveRiskGaugeZone(score: number): RiskGaugeZone {
  if (score <= 30) return 'LOW'
  if (score <= 60) return 'MEDIUM'
  if (score <= 80) return 'HIGH'
  return 'CRITICAL'
}

const ZONE_CONFIG: Record<RiskGaugeZone, { label: string; color: string }> = {
  LOW: { label: 'Baixo risco', color: '#22c55e' },
  MEDIUM: { label: 'Risco médio', color: '#facc15' },
  HIGH: { label: 'Risco alto', color: '#f97316' },
  CRITICAL: { label: 'Risco crítico', color: '#ef4444' },
}

type RiskGaugeProps = {
  score?: number | null
  confirmedSources: number
  totalSources: number
  confidenceInterval?: string | null
  source?: string | null
  computedAt?: string | null
  confidence: ConfidenceBadgeInput
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
}

export function RiskGauge({
  score,
  confirmedSources,
  totalSources,
  confidenceInterval,
  source,
  computedAt,
  confidence,
  loading,
  errorMessage,
  onRetry,
}: RiskGaugeProps) {
  const hasData = typeof score === 'number'
  const zone = hasData ? resolveRiskGaugeZone(score) : null
  const angle = hasData ? -90 + (Math.min(Math.max(score, 0), 100) * 180) / 100 : -90
  const zoneConfig = zone ? ZONE_CONFIG[zone] : null

  return (
    <ChartContainer
      title="Score geral de risco"
      description="Gauge com zonas por criticidade"
      loading={loading}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyMessage={hasData ? null : 'Score indisponível para este BIN no momento.'}
    >
      <div role="img" aria-label={`Gauge de risco ${hasData ? `${score}/100` : 'indisponível'}`} className="space-y-3">
        <svg viewBox="0 0 240 140" className="mx-auto h-44 w-full max-w-xs">
          <path d="M20 120 A100 100 0 0 1 80 34" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />
          <path d="M80 34 A100 100 0 0 1 120 20" fill="none" stroke="#facc15" strokeWidth="16" strokeLinecap="round" />
          <path d="M120 20 A100 100 0 0 1 170 34" fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round" />
          <path d="M170 34 A100 100 0 0 1 220 120" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" />
          <line
            x1="120"
            y1="120"
            x2="120"
            y2="36"
            stroke={zoneConfig?.color ?? '#94a3b8'}
            strokeWidth="5"
            transform={`rotate(${angle} 120 120)`}
            style={{ transition: 'transform 800ms ease-out' }}
          />
          <circle cx="120" cy="120" r="8" fill={zoneConfig?.color ?? '#94a3b8'} />
          <text x="120" y="88" textAnchor="middle" fill="currentColor" className="text-[28px] font-bold text-fg">
            {hasData ? score : '—'}
          </text>
        </svg>
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold">{zoneConfig?.label ?? 'Indisponível'}</p>
          {confidenceInterval ? <p className="text-xs text-fg-muted">Intervalo de confiança: {confidenceInterval}</p> : null}
          <p className="text-xs text-fg-muted">Calculado a partir de {confirmedSources}/{totalSources} fontes confirmadas</p>
          <ConfidenceBadge value={confidence} />
          {source || computedAt ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-xs text-ds-accent underline decoration-dotted">
                    Fonte e horário
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fonte: {source ?? 'não informada'}</p>
                  <p>Atualizado em: {computedAt ?? 'não informado'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </div>
    </ChartContainer>
  )
}

export default RiskGauge
