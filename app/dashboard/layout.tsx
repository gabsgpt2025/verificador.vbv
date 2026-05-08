import type * as React from 'react'

import { AppShell } from '@/components/shell/AppShell'
import { getUserProfile, requireAuth } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <AppShell
      user={{ email: user.email }}
      profile={{
        full_name: (profile?.full_name as string | null | undefined) ?? null,
        credits: (profile?.credits as number | null | undefined) ?? 0,
      }}
    >
      {children}
    </AppShell>
  )
}
