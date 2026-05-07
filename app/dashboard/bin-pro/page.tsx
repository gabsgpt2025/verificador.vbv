import { requireAuth, getUserProfile } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VeriFiBINInterface } from "@/components/bin-pro/verifibinn-interface"
import { BinProHighlights } from "@/components/bin-pro/bin-pro-highlights"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { Shield } from "lucide-react"

export default async function BinProPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CyberHeading level={2} className="mb-0">
              VeriFiBIN 2.0
            </CyberHeading>
          </div>
          <CyberText color="muted" className="text-lg">
            Plataforma profissional de inteligência antifraude e análise de BIN
          </CyberText>

          <BinProHighlights />
        </div>

        <VeriFiBINInterface userId={user.id} />
      </main>
    </div>
  )
}
