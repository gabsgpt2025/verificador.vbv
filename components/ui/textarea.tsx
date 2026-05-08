import * as React from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  error?: boolean
}

function Textarea({ className, error = false, ...props }: TextareaProps) {
  const invalid = error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'

  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(
        'flex min-h-24 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg shadow-xs outline-none transition-colors placeholder:text-fg-muted hover:border-border-strong focus-visible:border-ds-accent focus-visible:ring-[3px] focus-visible:ring-ds-accent/40 disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-surface-elevated disabled:text-fg-disabled disabled:opacity-100',
        invalid && 'border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/30',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
