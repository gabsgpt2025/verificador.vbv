import type * as React from 'react'

import { CommandPalette } from '@/components/shell/CommandPalette'
import { SideNav } from '@/components/shell/SideNav'
import { TopBar } from '@/components/shell/TopBar'

interface AppShellProps {
  user: { email?: string | null }
  profile: { full_name?: string | null; credits?: number | null }
  children: React.ReactNode
}

function AppShell({ user, profile, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-app">
      <TopBar user={user} profile={profile} />
      <div className="flex">
        <SideNav />
        <main className="min-w-0 flex-1 bg-bg-app px-4 py-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  )
}

export { AppShell }
