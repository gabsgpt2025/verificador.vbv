import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

function EmptyState({ icon, title, description, ctaLabel, onCtaClick, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-bg-surface p-8 text-center', className)}>
      {icon ? <div className="mb-3 text-fg-muted" aria-hidden="true">{icon}</div> : null}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>
      {ctaLabel ? (
        <Button type="button" variant="primary" size="sm" className="mt-4" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  )
}

export type { EmptyStateProps }
export { EmptyState }
