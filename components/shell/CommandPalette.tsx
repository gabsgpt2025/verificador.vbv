'use client'

import { Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useCommandPalette } from '@/components/shell/useCommandPalette'

interface CommandItem {
  label: string
  action: () => Promise<void> | void
}

function CommandPalette() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { open, setOpen } = useCommandPalette()
  const [query, setQuery] = useState('')

  const commands = useMemo<CommandItem[]>(
    () => [
      { label: 'Ir para Dashboard', action: () => router.push('/dashboard') },
      { label: 'Ir para BIN Pro', action: () => router.push('/dashboard/bin-pro') },
      { label: 'Verificar BIN', action: () => router.push('/dashboard') },
      { label: 'Ver Créditos', action: () => router.push('/dashboard/credits') },
      { label: 'Configurações', action: () => router.push('/settings') },
      {
        label: 'Logout',
        action: async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push('/auth/login')
        },
      },
      {
        label: 'Toggle theme',
        action: () => setTheme(resolvedTheme === 'light' ? 'dark' : 'light'),
      },
    ],
    [resolvedTheme, router, setTheme],
  )

  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))

  const runCommand = async (command: CommandItem) => {
    await command.action()
    setOpen(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="border-b border-border-subtle px-3 py-2">
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <Search className="size-4" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite um comando..."
              className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            />
          </label>
        </div>
        <ul className="max-h-72 overflow-auto p-2">
          {filtered.map((command) => (
            <li key={command.label}>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-bg-surface-hover"
                onClick={() => runCommand(command)}
              >
                {command.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="px-3 py-2 text-sm text-fg-muted">Nenhum comando encontrado.</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

export { CommandPalette }
