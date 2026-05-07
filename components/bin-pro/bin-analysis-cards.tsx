"use client"

// bin-analysis-cards.tsx — Legacy card component (v1)
// For the new VeriFiBIN 2.0 anti-fraud analysis UI, see bin-analysis-v2-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import type { LegacyBINAnalysisResult } from "@/lib/premium-3-0/types"
import { CreditCard, Globe, Shield, Brain, AlertTriangle, TrendingUp, Lock } from "lucide-react"

interface BinAnalysisCardsProps {
  result: LegacyBINAnalysisResult
}

export function BinAnalysisCards({ result }: BinAnalysisCardsProps) {
  const cards = [
    {
      title: "INFORMAÇÕES DO CARTÃO",
      icon: <CreditCard className="h-5 w-5" />,
      color: "primary",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CyberText variant="caption" color="muted">
                Tipo
              </CyberText>
              <CyberText className="font-mono font-bold capitalize">{result.type}</CyberText>
            </div>
            <div>
              <CyberText variant="caption" color="muted">
                Nível
              </CyberText>
              <CyberText className="font-mono font-bold">{result.level}</CyberText>
            </div>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Banco Emissor
            </CyberText>
            <CyberText className="font-mono font-bold">{result.bank}</CyberText>
          </div>
        </div>
      ),
    },
    {
      title: "DADOS GEOGRÁFICOS",
      icon: <Globe className="h-5 w-5" />,
      color: "secondary",
      content: (
        <div className="space-y-3">
          <div>
            <CyberText variant="caption" color="muted">
              País
            </CyberText>
            <CyberText className="font-mono font-bold">{result.country}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Moeda
            </CyberText>
            <CyberText className="font-mono font-bold">{result.currency}</CyberText>
          </div>
        </div>
      ),
    },
    {
      title: "ANÁLISE DE SEGURANÇA",
      icon: <Shield className="h-5 w-5" />,
      color: "accent",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CyberText variant="caption" color="muted">
                Status 3DS (estimado)
              </CyberText>
              <Badge variant={result.analysis.threeDSStatus === "ENABLED" ? "default" : "destructive"}>
                {result.analysis.threeDSStatus}
              </Badge>
            </div>
            <div>
              <CyberText variant="caption" color="muted">
                VBV (estimado)
              </CyberText>
              <Badge variant={result.analysis.vbvStatus === "ENABLED" ? "default" : "destructive"}>
                {result.analysis.vbvStatus}
              </Badge>
            </div>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Probabilidade de Autenticação Adicional
            </CyberText>
            <CyberText className="font-mono font-bold text-accent">{result.analysis.bypassProbability}%</CyberText>
          </div>
        </div>
      ),
    },
    {
      title: "INSIGHTS DE ANÁLISE",
      icon: <Brain className="h-5 w-5" />,
      color: "primary",
      content: (
        <div className="space-y-3">
          <CyberText variant="body" className="text-sm leading-relaxed">
            {result.analysis.aiInsights}
          </CyberText>
        </div>
      ),
    },
    {
      title: "INDICADORES DE RISCO",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "destructive",
      content: (
        <div className="space-y-2">
          {result.analysis.fraudIndicators.map((indicator, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
              <CyberText variant="caption">{indicator}</CyberText>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "SCORE DE RISCO",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "accent",
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CyberText variant="caption" color="muted">
              Nível de Risco
            </CyberText>
            <Badge variant={result.riskLevel === "LOW" ? "default" : "destructive"}>{result.riskLevel}</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${result.riskScore}%` }}
            />
          </div>
          <CyberText variant="caption" color="muted">
            Score: {result.riskScore}/100
          </CyberText>
        </div>
      ),
    },
    {
      title: "RECOMENDAÇÕES",
      icon: <Lock className="h-5 w-5" />,
      color: "secondary",
      content: (
        <div className="space-y-2">
          {result.analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
              <CyberText variant="caption">{recommendation}</CyberText>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="cyber-card hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center space-x-2 font-mono text-sm text-${card.color} neon-glow`}>
              {card.icon}
              <span>{card.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>{card.content}</CardContent>
        </Card>
      ))}
    </div>
  )
}
