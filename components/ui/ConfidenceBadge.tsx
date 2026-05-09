'use client'

import { createElement } from 'react'

import { Badge } from '@/components/ui/badge'

export type ConfidenceLevel = 'VERIFIED' | 'CALCULATED' | 'ESTIMATED' | 'UNAVAILABLE'

export type ConfidenceBadgeInput = {
  level: ConfidenceLevel
  source?: string | null
  margin?: string | null
}

export function resolveConfidenceBadge(input: ConfidenceBadgeInput): ConfidenceBadgeInput {
  if (input.level === 'VERIFIED' && !input.source?.trim()) {
    return {
      level: 'UNAVAILABLE',
      source: null,
      margin: input.margin ?? null,
    }
  }

  return input
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; emoji: string; tone: string }> = {
  VERIFIED: {
    label: 'Verificado',
    emoji: '🟢',
    tone: 'border-primary/40 text-primary',
  },
  CALCULATED: {
    label: 'Calculado',
    emoji: '🔵',
    tone: 'border-ds-accent/40 text-ds-accent',
  },
  ESTIMATED: {
    label: 'Estimado',
    emoji: '🟡',
    tone: 'border-risk-medium/40 text-risk-medium',
  },
  UNAVAILABLE: {
    label: 'Indisponível',
    emoji: '⚪',
    tone: 'border-border-subtle text-fg-muted',
  },
}

type ConfidenceBadgeProps = {
  value: ConfidenceBadgeInput
  className?: string
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const safeValue = resolveConfidenceBadge(value)
  const config = CONFIDENCE_CONFIG[safeValue.level]
  const marginText = safeValue.level === 'ESTIMATED' && safeValue.margin ? ` (margem ${safeValue.margin})` : ''
  return createElement(
    Badge,
    { variant: 'outline', className: `${config.tone} ${className ?? ''}`.trim() },
    createElement('span', { 'aria-hidden': true }, config.emoji),
    createElement('span', null, ` ${config.label}${marginText}`),
  )
}

export default ConfidenceBadge
