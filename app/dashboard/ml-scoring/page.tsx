import { requireAuth, getUserProfile } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MLScoringDashboard } from "@/components/bin-pro/ml-scoring-dashboard"
import { CyberHeading, CyberText } from "@/components/cyberpunk/cyber-typography"
import { Brain, Shield } from "lucide-react"

export default async function MLScoringPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  // Only allow admin access to ML scoring dashboard
  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CyberHeading level={2} className="mb-4">
            ACCESS DENIED
          </CyberHeading>
          <CyberText color="muted">Administrator privileges required</CyberText>
        </div>
      </div>
    )
  }

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
              ML SCORING SYSTEM
            </CyberHeading>
          </div>
          <CyberText color="muted" className="text-lg">
            Advanced Machine Learning models for fraud detection and risk assessment
          </CyberText>

          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-secondary" />
              <CyberText variant="caption" color="secondary">
                Real-time Analysis
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-accent" />
              <CyberText variant="caption" color="accent">
                Multi-factor Scoring
              </CyberText>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <CyberText variant="caption" color="primary">
                Admin Only Access
              </CyberText>
            </div>
          </div>
        </div>

        <MLScoringDashboard />
      </main>
    </div>
  )
}
