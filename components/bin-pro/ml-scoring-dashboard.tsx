"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import { Activity, Database, Layers, Shield, TrendingUp, Zap } from "lucide-react"

/**
 * Dashboard de Análise Heurística Multi-Dimensional v3.0
 *
 * Substituiu o antigo "ML Scoring Dashboard" que exibia modelos de ML fictícios
 * (FraudDetectionV3, RiskAssessmentV2) com métricas inventadas.
 *
 * Agora exibe de forma transparente a metodologia real utilizada:
 * um ensemble heurístico de 6 dimensões ponderadas.
 */

const ANALYSIS_DIMENSIONS = [
  { name: "Risco do BIN", weight: 30, icon: "💳", description: "Score base do BIN + tipo de cartão + emissor" },
  { name: "Risco Geográfico", weight: 20, icon: "🌍", description: "Tier do país + reputação da região" },
  { name: "Risco Comportamental", weight: 15, icon: "📊", description: "Padrões de uso e velocidade de transações" },
  { name: "Risco Temporal", weight: 10, icon: "⏰", description: "Horário, dia da semana, fuso horário" },
  { name: "Risco do Dispositivo", weight: 15, icon: "📱", description: "Navegador, SO, fingerprint" },
  { name: "Risco do Gateway", weight: 10, icon: "⚡", description: "Valor da transação, MCC, merchant" },
] as const

export function MLScoringDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Metodologia */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Layers className="h-5 w-5" />
            <span>METODOLOGIA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <CyberText className="font-mono font-bold text-sm">Análise Heurística v3.0</CyberText>
              <Badge variant="default" className="font-mono text-xs">
                Multi-Dimensional
              </Badge>
            </div>
            <CyberText variant="caption" color="muted" className="leading-relaxed">
              Ensemble de 6 dimensões ponderadas com dados reais de APIs (Neutrino, Mastercard) 
              e enriquecimento contextual. Scoring determinístico e auditável.
            </CyberText>
          </div>
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <CyberText className="font-mono font-bold text-sm">Fontes de Dados</CyberText>
              <Badge variant="secondary" className="font-mono text-xs">
                3+ APIs
              </Badge>
            </div>
            <CyberText variant="caption" color="muted" className="leading-relaxed">
              Neutrino BIN Lookup, Mastercard BIN Resources e análise heurística 
              multi-fator com consenso entre fontes.
            </CyberText>
          </div>
        </CardContent>
      </Card>

      {/* Dimensões de Análise */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-secondary neon-glow">
            <Activity className="h-5 w-5" />
            <span>DIMENSÕES</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ANALYSIS_DIMENSIONS.map((dim, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{dim.icon}</span>
                <CyberText variant="caption">{dim.name}</CyberText>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-muted rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${(dim.weight / 30) * 100}%` }}
                  />
                </div>
                <CyberText variant="caption" className="font-mono w-8 text-right">
                  {dim.weight}%
                </CyberText>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Características do Motor */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-accent neon-glow">
            <Shield className="h-5 w-5" />
            <span>CARACTERÍSTICAS</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Determinístico", desc: "Mesmos inputs = mesmo score, sempre" },
            { label: "Auditável", desc: "Cada fator de risco é rastreável" },
            { label: "Multi-fonte", desc: "Consenso entre Neutrino + Mastercard" },
            { label: "Contextual", desc: "Considera valor, MCC, geo, tempo" },
            { label: "Compliance", desc: "PSD2/SCA, RBI, BACEN integrados" },
          ].map((item, index) => (
            <div key={index} className="p-2 bg-muted/20 rounded-lg border border-border/50">
              <CyberText variant="caption" className="font-mono font-bold text-primary">
                ✅ {item.label}
              </CyberText>
              <CyberText variant="caption" color="muted" className="block text-xs mt-1">
                {item.desc}
              </CyberText>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="cyber-card md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-mono text-primary neon-glow">
            <Database className="h-5 w-5" />
            <span>STATUS DO SISTEMA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 mb-2">
                <Zap className="h-8 w-8 text-primary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-primary">ATIVO</CyberText>
              <CyberText variant="caption" color="muted">
                Motor Heurístico
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30 mb-2">
                <TrendingUp className="h-8 w-8 text-secondary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-secondary">v3.0</CyberText>
              <CyberText variant="caption" color="muted">
                Versão Atual
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 mb-2">
                <Activity className="h-8 w-8 text-accent mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-accent">6</CyberText>
              <CyberText variant="caption" color="muted">
                Dimensões de Análise
              </CyberText>
            </div>
            <div className="text-center">
              <div className="p-4 bg-primary/20 rounded-lg border border-primary/30 mb-2">
                <Layers className="h-8 w-8 text-primary mx-auto" />
              </div>
              <CyberText className="font-mono font-bold text-primary">3+</CyberText>
              <CyberText variant="caption" color="muted">
                APIs Integradas
              </CyberText>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
