import { requireAuth, getUserProfile } from "@/lib/auth"
import { BinProHistory } from "@/components/bin-pro/bin-pro-history"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Premium3DAnalyzer } from "@/components/premium-3-0/Premium3DAnalyzer"
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
              VeriFiBIN 3.0 - Premium
            </CyberHeading>
          </div>
          <CyberText color="muted" className="text-lg">
            Plataforma profissional com inteligência artificial anti-fraude, análise holística completa e integração Mastercard
          </CyberText>

          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-secondary" />
              <CyberText variant="caption" color="secondary">
                Motor Anti-Fraude v3.0
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <CyberText variant="caption" color="accent">
                Análise Holística Mastercard
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-primary" />
              <CyberText variant="caption" color="primary">
                Integração APIs Completa
              </CyberText>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Premium3DAnalyzer />
          <BinProHistory userId={user.id} />
        </div>
      </main>
    </div>
  )
}
