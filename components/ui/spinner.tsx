import { cn } from '@/lib/utils'

const spinnerSizes = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
} as const

type SpinnerSize = keyof typeof spinnerSizes

interface SpinnerProps extends React.ComponentProps<'svg'> {
  size?: SpinnerSize
  label?: string
}

function Spinner({ className, size = 'md', label = 'Loading', ...props }: SpinnerProps) {
  return (
    <svg
      data-slot="spinner"
      className={cn('animate-spin text-current motion-reduce:animate-none', spinnerSizes[size], className)}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
      />
    </svg>
  )
}

export { Spinner }
