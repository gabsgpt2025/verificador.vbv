import { CreditsHistory } from '@/components/credits/credits-history'
import { requireAuth } from '@/lib/auth'

export default async function CreditsHistoryPage() {
  const user = await requireAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Credits History</h1>
        <p className="text-muted-foreground">View and export your complete credit transaction history.</p>
      </div>

      <CreditsHistory userId={user.id} />
    </div>
  )
}
