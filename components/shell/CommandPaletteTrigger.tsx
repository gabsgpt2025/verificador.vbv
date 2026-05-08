'use client'

import { Button } from '@/components/ui/button'

function CommandPaletteTrigger() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Abrir command palette"
      onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
    >
      <span>⌘K</span>
    </Button>
  )
}

export { CommandPaletteTrigger }
