import type * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ds-accent/40 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border border-border-default bg-bg-surface text-fg hover:bg-bg-surface-hover',
        primary: 'bg-ds-accent text-fg-on-accent hover:bg-ds-accent-hover active:bg-ds-accent-active',
        secondary: 'border border-border-default bg-bg-surface text-fg hover:bg-bg-surface-hover',
        ghost: 'text-fg-muted hover:bg-bg-surface-hover hover:text-fg',
        destructive: 'bg-status-danger text-fg-on-accent hover:bg-status-danger/90',
        accent: 'border border-ds-accent/30 bg-ds-accent/10 text-ds-accent hover:bg-ds-accent/20',
        link: 'text-ds-accent underline-offset-4 hover:underline',
        outline: 'border border-border-default bg-transparent text-fg hover:bg-bg-surface-hover',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-sm',
        icon: 'size-9',
        default: 'h-9 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} aria-hidden="true" /> : null}
      <span>{loading && loadingText ? loadingText : children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
