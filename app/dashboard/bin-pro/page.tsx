import { BinProHistory } from '@/components/bin-pro/bin-pro-history'
import { Premium3DAnalyzer } from '@/components/premium-3-0/Premium3DAnalyzer'
import { requireAuth } from '@/lib/auth'

export default async function BinProPage() {
  const user = await requireAuth()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <Premium3DAnalyzer />
      <BinProHistory userId={user.id} />
    </div>
  )
}
