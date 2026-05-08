'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const isLight = resolvedTheme === 'light'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
    >
      {isLight ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
    </Button>
  )
}

export { ThemeToggle }
