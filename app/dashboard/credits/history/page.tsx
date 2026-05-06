import { requireAuth, getUserProfile } from "@/lib/auth"
import { CreditsHistory } from "@/components/credits/credits-history"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function CreditsHistoryPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Credits History</h1>
          <p className="text-muted-foreground">View and export your complete credit transaction history.</p>
        </div>

        <CreditsHistory userId={user.id} />
      </main>
    </div>
  )
}
