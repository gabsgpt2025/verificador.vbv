import { requireAuth, getUserProfile } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VeriFiBINInterface } from "@/components/bin-pro/verifibinn-interface"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { Shield, BarChart2, Globe } from "lucide-react"

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

          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-secondary" />
              <CyberText variant="caption" color="secondary">
                Score Explicável
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <CyberText variant="caption" color="accent">
                Análise 3DS/VBV Inferida
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-primary" />
              <CyberText variant="caption" color="primary">
                Compliance Regulatório
              </CyberText>
            </div>
          </div>
        </div>

        <VeriFiBINInterface userId={user.id} />
      </main>
    </div>
  )
}
