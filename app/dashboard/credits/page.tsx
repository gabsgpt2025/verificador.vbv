import { requireAuth, getUserProfile } from "@/lib/auth"
import { CreditsManager } from "@/components/credits/credits-manager"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function CreditsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Credits Management</h1>
          <p className="text-muted-foreground">Manage your credits and purchase additional credits as needed.</p>
        </div>

        <CreditsManager userId={user.id} isAdmin={profile?.role === "admin"} initialCredits={profile?.credits || 0} />
      </main>
    </div>
  )
}
