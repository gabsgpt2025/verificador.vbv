'use client'

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type ChartContainerProps = {
  title: string
  description?: string
  loading?: boolean
  emptyMessage?: string | null
  errorMessage?: string | null
  retryLabel?: string
  onRetry?: (() => void) | null
  children: ReactNode
  className?: string
}

export function ChartContainer({
  title,
  description,
  loading = false,
  emptyMessage,
  errorMessage,
  retryLabel = 'Tentar novamente',
  onRetry,
  children,
  className,
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" role="status" aria-label={`${title}: carregando`}>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-44 w-full animate-pulse" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-3">
                <p>{errorMessage}</p>
                {onRetry ? (
                  <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    {retryLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : emptyMessage ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-surface p-4 text-sm text-fg-muted">{emptyMessage}</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export default ChartContainer
