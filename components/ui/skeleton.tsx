import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('rounded-md bg-bg-surface-elevated animate-pulse motion-reduce:animate-none', className)}
      {...props}
    />
  )
}

export { Skeleton }
