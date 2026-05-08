'use client'

import type * as React from 'react'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  formatAs?: 'number' | 'currency' | 'percent' | 'text'
  currency?: 'BRL' | 'USD' | 'EUR'
  delta?: { value: number; label?: string; direction?: 'up' | 'down' | 'neutral' }
  icon?: React.ReactNode
  tooltip?: string
  loading?: boolean
}

const deltaStyles = {
  up: 'text-status-success',
  down: 'text-status-danger',
  neutral: 'text-fg-muted',
} as const

function formatMetricValue(value: string | number, formatAs: MetricCardProps['formatAs'], currency: MetricCardProps['currency']) {
  if (typeof value !== 'number') return value
  if (formatAs === 'currency') return formatCurrency(value, currency ?? 'BRL')
  if (formatAs === 'percent') return formatPercent(value / 100)
  if (formatAs === 'text') return String(value)
  return formatNumber(value)
}

function MetricCard({
  label,
  value,
  formatAs = 'number',
  currency = 'BRL',
  delta,
  icon,
  tooltip,
  loading = false,
}: MetricCardProps) {
  const direction = delta?.direction ?? (delta ? (delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'neutral') : 'neutral')
  const DeltaIcon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : ArrowRight

  const content = (
    <Card variant="surface" className="py-4">
      <CardContent className="space-y-3 px-[var(--card-padding)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
          {icon ? <div className="text-ds-accent" aria-hidden="true">{icon}</div> : null}
        </div>

        {loading ? <Skeleton className="h-8 w-2/3" /> : <p className="text-2xl font-bold text-fg">{formatMetricValue(value, formatAs, currency)}</p>}

        {loading ? (
          <Skeleton className="h-4 w-1/2" />
        ) : delta ? (
          <p className={cn('inline-flex items-center gap-1 text-xs', deltaStyles[direction])}>
            <DeltaIcon className="size-3" aria-hidden="true" />
            <span>{formatPercent(Math.abs(delta.value) / 100)}{delta.label ? ` · ${delta.label}` : ''}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )

  if (!tooltip) return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export type { MetricCardProps }
export { MetricCard }
