import { CreditsManager } from '@/components/credits/credits-manager'
import { getUserProfile, requireAuth } from '@/lib/auth'

export default async function CreditsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Credits Management</h1>
        <p className="text-muted-foreground">Manage your credits and purchase additional credits as needed.</p>
      </div>

      <CreditsManager userId={user.id} isAdmin={profile?.role === 'admin'} initialCredits={profile?.credits || 0} />
    </div>
  )
}
