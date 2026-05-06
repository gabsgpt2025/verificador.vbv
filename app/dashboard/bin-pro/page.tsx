import { requireAuth, getUserProfile } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BinProInterface } from "@/components/bin-pro/bin-pro-interface"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { Brain, Shield, TrendingUp } from "lucide-react"

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
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <CyberHeading level={2} className="mb-0">
              BIN PRO 2.0
            </CyberHeading>
          </div>
          <CyberText color="muted" className="text-lg">
            Advanced BIN analysis powered by AI and Machine Learning
          </CyberText>

          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-secondary" />
              <CyberText variant="caption" color="secondary">
                AI-Powered Analysis
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <CyberText variant="caption" color="accent">
                ML Risk Scoring
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-primary" />
              <CyberText variant="caption" color="primary">
                3 Credits per Analysis
              </CyberText>
            </div>
          </div>
        </div>

        <BinProInterface userId={user.id} />
      </main>
    </div>
  )
}
