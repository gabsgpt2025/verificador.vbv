'use client'

import type * as React from 'react'
import { AlertTriangle, OctagonAlert, ShieldAlert, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical'
  score?: number
  label?: string
  showIcon?: boolean
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'inline' | 'card'
  tooltip?: string
}

const levelConfig = {
  low: { label: 'Baixo risco', icon: ShieldCheck, text: 'text-risk-low', badge: 'risk-low' as const },
  medium: { label: 'Risco médio', icon: ShieldAlert, text: 'text-risk-medium', badge: 'risk-medium' as const },
  high: { label: 'Risco alto', icon: AlertTriangle, text: 'text-risk-high', badge: 'risk-high' as const },
  critical: { label: 'Risco crítico', icon: OctagonAlert, text: 'text-risk-critical', badge: 'risk-critical' as const },
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

function RiskIndicator({
  level,
  score,
  label,
  showIcon = true,
  showScore,
  size = 'md',
  variant = 'badge',
  tooltip,
}: RiskIndicatorProps) {
  const config = levelConfig[level]
  const Icon = config.icon
  const resolvedShowScore = showScore ?? typeof score === 'number'
  const resolvedLabel = label ?? config.label
  const ariaLabel = `${resolvedLabel}${resolvedShowScore && typeof score === 'number' ? `, score ${score}` : ''}`

  const content: React.ReactNode =
    variant === 'card' ? (
      <Card variant="elevated" className="py-4">
        <CardContent className="space-y-2 px-4">
          <div className="flex items-center justify-between">
            <div className={cn('flex items-center gap-2 font-medium', config.text, sizeClasses[size])}>
              {showIcon ? <Icon className="size-4" aria-hidden="true" /> : null}
              <span>{resolvedLabel}</span>
            </div>
            {resolvedShowScore && typeof score === 'number' ? <span className="text-sm font-semibold text-fg">{score}</span> : null}
          </div>
          {typeof score === 'number' ? <Progress value={score} aria-label={`Risk score ${score}`} /> : null}
        </CardContent>
      </Card>
    ) : variant === 'inline' ? (
      <div className={cn('inline-flex items-center gap-2', config.text, sizeClasses[size])}>
        {showIcon ? <Icon className="size-4" aria-hidden="true" /> : null}
        <span>{resolvedLabel}</span>
        {resolvedShowScore && typeof score === 'number' ? <span className="font-semibold text-fg">{score}</span> : null}
      </div>
    ) : (
      <Badge variant={config.badge} className={cn(sizeClasses[size])}>
        {showIcon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        <span>{resolvedLabel}</span>
        {resolvedShowScore && typeof score === 'number' ? <span aria-hidden="true">· {score}</span> : null}
      </Badge>
    )

  const wrapped = tooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  )

  return (
    <div role="status" aria-label={ariaLabel}>
      {wrapped}
    </div>
  )
}

export type { RiskIndicatorProps }
export { RiskIndicator }
