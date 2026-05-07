"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { getAvailableModels, getModelMetrics } from "@/lib/premium-3-0/mlModels"
import { Brain, TrendingUp, Target, Zap, Activity, Database } from "lucide-react"

export function MLScoringDashboard() {
  const models = getAvailableModels()
  const metrics = getModelMetrics()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Model Status */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Brain className="h-5 w-5" />
            <span>ML MODELS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {models.map((model, index) => (
            <div key={index} className="p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <CyberText className="font-mono font-bold text-sm">{model.name}</CyberText>
                <Badge variant="default" className="font-mono text-xs">
                  v{model.version}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <CyberText variant="caption" color="muted">
                    Accuracy
                  </CyberText>
                  <CyberText variant="caption" className="font-mono">
                    {model.accuracy}%
                  </CyberText>
                </div>
                <Progress value={model.accuracy} className="h-2" />
                <CyberText variant="caption" color="muted">
                  Last trained: {model.lastTrained}
                </CyberText>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-secondary neon-glow">
            <Target className="h-5 w-5" />
            <span>PERFORMANCE</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <CyberText className="font-mono font-bold text-lg text-primary">
                {(metrics.precision * 100).toFixed(1)}%
              </CyberText>
              <CyberText variant="caption" color="muted">
                Precision
              </CyberText>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <CyberText className="font-mono font-bold text-lg text-secondary">
                {(metrics.recall * 100).toFixed(1)}%
              </CyberText>
              <CyberText variant="caption" color="muted">
                Recall
              </CyberText>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <CyberText className="font-mono font-bold text-lg text-accent">
                {(metrics.f1Score * 100).toFixed(1)}%
              </CyberText>
              <CyberText variant="caption" color="muted">
                F1 Score
              </CyberText>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <CyberText className="font-mono font-bold text-lg text-primary">
                {(metrics.auc * 100).toFixed(1)}%
              </CyberText>
              <CyberText variant="caption" color="muted">
                AUC
              </CyberText>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-accent neon-glow">
            <Activity className="h-5 w-5" />
            <span>RISK FACTORS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Geographic Risk", weight: 18, icon: "🌍" },
            { name: "Historical Fraud", weight: 20, icon: "📊" },
            { name: "Bank Reputation", weight: 15, icon: "🏦" },
            { name: "Card Type Risk", weight: 12, icon: "💳" },
            { name: "Velocity Risk", weight: 10, icon: "⚡" },
            { name: "Other Factors", weight: 25, icon: "🔍" },
          ].map((factor, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{factor.icon}</span>
                <CyberText variant="caption">{factor.name}</CyberText>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${(factor.weight / 25) * 100}%` }} />
                </div>
                <CyberText variant="caption" className="font-mono w-8 text-right">
                  {factor.weight}%
                </CyberText>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="cyber-card md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Database className="h-5 w-5" />
            <span>SYSTEM STATUS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 mb-2">
                <Zap className="h-8 w-8 text-primary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-primary">ACTIVE</CyberText>
              <CyberText variant="caption" color="muted">
                ML Engine
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30 mb-2">
                <TrendingUp className="h-8 w-8 text-secondary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-secondary">99.7%</CyberText>
              <CyberText variant="caption" color="muted">
                Uptime
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 mb-2">
                <Activity className="h-8 w-8 text-accent mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-accent">1,247</CyberText>
              <CyberText variant="caption" color="muted">
                Analyses Today
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 mb-2">
                <Target className="h-8 w-8 text-primary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-primary">94.7%</CyberText>
              <CyberText variant="caption" color="muted">
                Accuracy Rate
              </CyberText>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
