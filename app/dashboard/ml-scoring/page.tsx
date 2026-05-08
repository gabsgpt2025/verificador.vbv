import { Brain, Shield } from 'lucide-react'

import { MLScoringDashboard } from '@/components/bin-pro/ml-scoring-dashboard'
import { CyberHeading, CyberText } from '@/components/cyberpunk/cyber-typography'
import { getUserProfile, requireAuth } from '@/lib/auth'

export default async function MLScoringPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (profile?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
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
    <div>
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <div className="rounded-lg border border-primary/30 bg-primary/20 p-2">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <CyberHeading level={2} className="mb-0">
            ML SCORING SYSTEM
          </CyberHeading>
        </div>
        <CyberText color="muted" className="text-lg">
          Advanced Machine Learning models for fraud detection and risk assessment
        </CyberText>

        <div className="mt-4 flex items-center space-x-6">
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
    </div>
  )
}
