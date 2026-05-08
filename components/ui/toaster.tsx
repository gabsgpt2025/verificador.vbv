'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from 'next-themes'

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      richColors
      toastOptions={{
        className: 'border border-border-default bg-bg-surface text-fg',
      }}
      {...props}
    />
  )
}

export { Toaster }
