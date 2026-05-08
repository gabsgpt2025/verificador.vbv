'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { CommandPaletteTrigger } from '@/components/shell/CommandPaletteTrigger'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { UserMenu } from '@/components/shell/UserMenu'

interface TopBarProps {
  user: { email?: string | null }
  profile: { full_name?: string | null; credits?: number | null }
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <ol className="hidden items-center gap-2 text-xs text-fg-muted md:flex" aria-label="Breadcrumb">
      {segments.map((segment, index) => (
        <li key={`${segment}-${index}`} className="capitalize">
          {index > 0 ? <span className="mr-2 text-fg-muted/70">/</span> : null}
          {segment.replace('-', ' ')}
        </li>
      ))}
    </ol>
  )
}

function TopBar({ user, profile }: TopBarProps) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-bg-surface">
      <div className="flex h-14 items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-fg">
            VeriFiBIN
          </Link>
        </div>

        <Breadcrumbs />

        <div className="flex items-center gap-1">
          <CommandPaletteTrigger />
          <ThemeToggle />
          <UserMenu user={user} profile={profile} />
        </div>
      </div>
    </header>
  )
}

export { TopBar }
