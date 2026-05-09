'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { AnalysisSourceSummary } from '@/lib/premium-3-0/holisticTypes'

type DataSourceBadgesProps = {
  sources: Array<{
    name: string
    status: 'ok' | 'warning' | 'neutral'
    latencyMs?: number | null
    responseTimestamp?: string | null
    responseVersion?: string | null
    summary?: AnalysisSourceSummary | null
    note?: string
  }>
}

const STATUS_LABEL: Record<DataSourceBadgesProps['sources'][number]['status'], { icon: string; className: string }> = {
  ok: { icon: '✅', className: 'border-primary/40 text-primary' },
  warning: { icon: '⚠️', className: 'border-risk-medium/40 text-risk-medium' },
  neutral: { icon: '⚪', className: 'border-border-subtle text-fg-muted' },
}

export function DataSourceBadges({ sources }: DataSourceBadgesProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Fontes consultadas">
        {sources.map((source) => {
          const status = STATUS_LABEL[source.status]

          return (
            <Tooltip key={source.name}>
              <TooltipTrigger asChild>
                <span role="listitem" className={`rounded-full border px-3 py-1 text-xs ${status.className}`}>
                  {source.name} {status.icon} {source.latencyMs ? `${source.latencyMs}ms` : source.note ?? ''}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Timestamp: {source.responseTimestamp ?? 'não informado'}</p>
                <p>Versão: {source.responseVersion ?? 'não informada'}</p>
                <p>Fonte: {source.summary?.issuer ?? source.summary?.brand ?? 'sem metadado adicional'}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default DataSourceBadges
