import type * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-bg-surface-elevated text-fg border border-border-default',
      info: 'bg-status-info/15 text-status-info border border-status-info/30',
      success: 'bg-status-success/15 text-status-success border border-status-success/30',
      warning: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
      danger: 'bg-status-danger/15 text-status-danger border border-status-danger/30',
      accent: 'bg-ds-accent/15 text-ds-accent border border-ds-accent/30',
      'risk-low': 'bg-risk-low/15 text-risk-low border border-risk-low/30',
      'risk-medium': 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30',
      'risk-high': 'bg-risk-high/15 text-risk-high border border-risk-high/30',
      'risk-critical': 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30',
      default: 'bg-bg-surface-elevated text-fg border border-border-default',
      secondary: 'bg-status-info/15 text-status-info border border-status-info/30',
      destructive: 'bg-status-danger/15 text-status-danger border border-status-danger/30',
      outline: 'bg-transparent text-fg border border-border-default',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
