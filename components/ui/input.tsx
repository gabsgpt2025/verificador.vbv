import * as React from 'react'

import { cn } from '@/lib/utils'

interface InputProps extends React.ComponentProps<'input'> {
  error?: boolean
}

function Input({ className, type, error = false, ...props }: InputProps) {
  const invalid = error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'

  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={invalid || undefined}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-border-default bg-bg-surface px-3 py-1 text-sm text-fg shadow-xs outline-none transition-colors placeholder:text-fg-muted hover:border-border-strong focus-visible:border-ds-accent focus-visible:ring-[3px] focus-visible:ring-ds-accent/40 disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-surface-elevated disabled:text-fg-disabled disabled:opacity-100 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        invalid && 'border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/30',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
