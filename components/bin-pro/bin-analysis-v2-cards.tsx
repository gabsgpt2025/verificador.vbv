"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CyberText } from "@/components/cyberpunk/cyber-typography"
import type { BINAnalysisV2Result, ConfidenceLevel, RiskLevel, RecommendationCode } from "@/src/lib/intelligence/types"
import {
  CreditCard,
  Globe,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  TrendingUp,
  FileCheck,
  Layers,
} from "lucide-react"

interface BinAnalysisV2CardsProps {
  result: BINAnalysisV2Result
}

// ─── Badge helpers ────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const colors: Record<ConfidenceLevel, string> = {
    ALTA: "bg-green-500/10 text-green-500 border-green-500/30",
    MEDIA: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    BAIXA: "bg-red-500/10 text-red-500 border-red-500/30",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${colors[level]}`}>
      Confiança {level}
    </span>
  )
}

function InferredBadge() {
  return (
    <span className="text-xs px-2 py-0.5 rounded border font-mono bg-yellow-500/10 text-yellow-400 border-yellow-500/30 ml-1">
      Inferido
    </span>
  )
}

function RealApiBadge() {
  return (
    <span className="text-xs px-2 py-0.5 rounded border font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 ml-1">
      API Real
    </span>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const colors: Record<RiskLevel, string> = {
    BAIXO: "bg-green-500/10 text-green-500 border-green-500/30",
    MEDIO: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    ALTO: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    CRITICO: "bg-red-500/10 text-red-500 border-red-500/30",
  }
  return (
    <span className={`text-sm px-2 py-0.5 rounded border font-mono font-bold ${colors[level]}`}>
      {level}
    </span>
  )
}

function RecommendationBadge({ code }: { code: RecommendationCode }) {
  const config: Record<RecommendationCode, { label: string; color: string }> = {
    APROVAR_COM_SEGURANCA: { label: "Aprovar com Segurança", color: "bg-green-500/10 text-green-500 border-green-500/30" },
    REVISAR: { label: "Revisar", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
    EXIGIR_3DS: { label: "Exigir 3DS", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
    BLOQUEAR_PREVENTIVAMENTE: { label: "Bloquear Preventivamente", color: "bg-red-500/10 text-red-500 border-red-500/30" },
    DADOS_INSUFICIENTES: { label: "Dados Insuficientes", color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
  }
  const { label, color } = config[code]
  return (
    <span className={`text-sm px-2 py-0.5 rounded border font-mono font-bold ${color}`}>
      {label}
    </span>
  )
}

// ─── Card 1: Main Technical Info ──────────────────────────────────────────

function MainCard({ result }: { result: BINAnalysisV2Result }) {
  const { technicalData, riskAnalysis, finalSummary } = result

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-mono text-sm text-primary neon-glow">
          <CreditCard className="h-5 w-5" />
          <span>DADOS DO CARTÃO</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CyberText variant="caption" color="muted">BIN</CyberText>
            <CyberText className="font-mono font-bold">{result.bin}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Bandeira <RealApiBadge />
            </CyberText>
            <CyberText className="font-mono font-bold">{technicalData.brand ?? "—"}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Tipo <RealApiBadge />
            </CyberText>
            <CyberText className="font-mono font-bold capitalize">{technicalData.cardType?.toLowerCase() ?? "—"}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Categoria <RealApiBadge />
            </CyberText>
            <CyberText className="font-mono font-bold capitalize">{technicalData.cardCategory?.toLowerCase() ?? "—"}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              País <RealApiBadge />
            </CyberText>
            <CyberText className="font-mono font-bold">{technicalData.country ?? "—"}</CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">
              Emissor <RealApiBadge />
            </CyberText>
            <CyberText className="font-mono font-bold">{technicalData.issuer ?? <span className="text-muted-foreground">Não identificado</span>}</CyberText>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          {technicalData.isPrepaid && (
            <Badge variant="secondary" className="font-mono text-xs">Pré-pago</Badge>
          )}
          {technicalData.isCommercial && (
            <Badge variant="secondary" className="font-mono text-xs">Comercial/PJ</Badge>
          )}
        </div>
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <CyberText variant="caption" color="muted">Score de Risco</CyberText>
            <RiskBadge level={riskAnalysis.level} />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <CyberText className="font-mono font-bold text-accent text-xl">{riskAnalysis.score}/100</CyberText>
            <RecommendationBadge code={riskAnalysis.recommendation} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card 2: 3DS/VBV Analysis ─────────────────────────────────────────────

function ThreeDSCard({ result }: { result: BINAnalysisV2Result }) {
  const { threeDSAnalysis } = result

  const statusConfig = {
    ATIVO_PROVAVEL: { label: "Provavelmente Ativo", color: "text-green-400", icon: <CheckCircle className="h-4 w-4" /> },
    INATIVO_PROVAVEL: { label: "Provavelmente Inativo", color: "text-red-400", icon: <XCircle className="h-4 w-4" /> },
    DESCONHECIDO: { label: "Desconhecido", color: "text-gray-400", icon: <Info className="h-4 w-4" /> },
    CONFIRMADO_ATIVO: { label: "Confirmado Ativo", color: "text-green-400", icon: <CheckCircle className="h-4 w-4" /> },
    CONFIRMADO_INATIVO: { label: "Confirmado Inativo", color: "text-red-400", icon: <XCircle className="h-4 w-4" /> },
  }

  const status = statusConfig[threeDSAnalysis.status]

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-mono text-sm text-secondary neon-glow">
          <Shield className="h-5 w-5" />
          <span>DIAGNÓSTICO 3DS/VBV</span>
          <InferredBadge />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-md">
          <CyberText variant="caption" className="text-yellow-400">
            ⚠️ Status inferido algoritmicamente — APIs de BIN não confirmam 3DS diretamente
          </CyberText>
        </div>
        <div>
          <CyberText variant="caption" color="muted">Status 3DS Estimado</CyberText>
          <div className={`flex items-center gap-2 font-mono font-bold ${status.color}`}>
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CyberText variant="caption" color="muted">Confiança</CyberText>
            <ConfidenceBadge level={threeDSAnalysis.confidence} />
          </div>
          <div>
            <CyberText variant="caption" color="muted">VBV Provável</CyberText>
            <CyberText className="font-mono font-bold">
              {threeDSAnalysis.vbvLikely ? "Sim (estimado)" : "Improvável"}
            </CyberText>
          </div>
          <div>
            <CyberText variant="caption" color="muted">Challenge Provável</CyberText>
            <ConfidenceBadge level={threeDSAnalysis.challengeLikelihood} />
          </div>
          <div>
            <CyberText variant="caption" color="muted">Protocolo Estimado</CyberText>
            <CyberText className="font-mono font-bold text-xs">{threeDSAnalysis.protocolLikely}</CyberText>
          </div>
        </div>
        <div>
          <CyberText variant="caption" color="muted">Métodos de Autenticação Prováveis</CyberText>
          <div className="flex gap-1 flex-wrap mt-1">
            {threeDSAnalysis.authMethodsLikely.map((method) => (
              <Badge key={method} variant="outline" className="font-mono text-xs">{method}</Badge>
            ))}
          </div>
        </div>
        <div className="pt-2 border-t border-border/40">
          <CyberText variant="caption" color="muted">Explicação Técnica</CyberText>
          <CyberText variant="caption" className="leading-relaxed mt-1 text-xs">
            {threeDSAnalysis.technicalExplanation}
          </CyberText>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card 3: Data Quality ─────────────────────────────────────────────────

function DataQualityCard({ result }: { result: BINAnalysisV2Result }) {
  const { dataQuality, source } = result

  const scoreColor =
    dataQuality.score >= 80 ? "text-green-400" :
    dataQuality.score >= 50 ? "text-yellow-400" :
    "text-red-400"

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-mono text-sm text-accent neon-glow">
          <Database className="h-5 w-5" />
          <span>QUALIDADE DOS DADOS</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <CyberText variant="caption" color="muted">Fonte dos Dados</CyberText>
          <CyberText className="font-mono font-bold text-sm">{source.provider}</CyberText>
        </div>
        <div>
          <CyberText variant="caption" color="muted">Score de Qualidade</CyberText>
          <div className="flex items-center gap-2">
            <CyberText className={`font-mono font-bold text-xl ${scoreColor}`}>
              {dataQuality.score}/100
            </CyberText>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${dataQuality.score >= 80 ? "bg-green-500" : dataQuality.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${dataQuality.score}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            {dataQuality.issuerKnown ? <CheckCircle className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
            <CyberText variant="caption">Emissor</CyberText>
          </div>
          <div className="flex items-center gap-1">
            {dataQuality.countryKnown ? <CheckCircle className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
            <CyberText variant="caption">País</CyberText>
          </div>
          <div className="flex items-center gap-1">
            {dataQuality.typeKnown ? <CheckCircle className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
            <CyberText variant="caption">Tipo</CyberText>
          </div>
          <div className="flex items-center gap-1">
            {dataQuality.categoryKnown ? <CheckCircle className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
            <CyberText variant="caption">Categoria</CyberText>
          </div>
        </div>
        {dataQuality.missingFields.length > 0 && (
          <div>
            <CyberText variant="caption" color="muted">Campos Ausentes</CyberText>
            <div className="flex gap-1 flex-wrap mt-1">
              {dataQuality.missingFields.map((f) => (
                <Badge key={f} variant="destructive" className="font-mono text-xs">{f}</Badge>
              ))}
            </div>
          </div>
        )}
        {dataQuality.warnings.length > 0 && (
          <div>
            <CyberText variant="caption" color="muted">Alertas</CyberText>
            {dataQuality.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <CyberText variant="caption" className="text-xs">{w}</CyberText>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-border/40">
          <div className="flex flex-wrap gap-1">
            <CyberText variant="caption" color="muted" className="w-full mb-1">Campos reais da API:</CyberText>
            {dataQuality.realApiFields.map((f) => (
              <Badge key={f} variant="outline" className="font-mono text-xs border-blue-500/30 text-blue-400">{f}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <CyberText variant="caption" color="muted" className="w-full mb-1">Campos inferidos:</CyberText>
            {dataQuality.inferredFields.map((f) => (
              <Badge key={f} variant="outline" className="font-mono text-xs border-yellow-500/30 text-yellow-400">{f}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card 4: Risk Analysis ────────────────────────────────────────────────

function RiskCard({ result }: { result: BINAnalysisV2Result }) {
  const { riskAnalysis, complianceData } = result

  const positiveFactors = riskAnalysis.riskBreakdown.filter((f) => f.numericImpact < 0)
  const negativeFactors = riskAnalysis.riskBreakdown.filter((f) => f.numericImpact > 0)
  const neutralFactors = riskAnalysis.riskBreakdown.filter((f) => f.numericImpact === 0)

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-mono text-sm text-destructive neon-glow">
          <TrendingUp className="h-5 w-5" />
          <span>ANÁLISE DE RISCO</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <CyberText className="font-mono font-bold text-2xl text-accent">{riskAnalysis.score}</CyberText>
          <div>
            <CyberText variant="caption" color="muted">Score de Risco</CyberText>
            <div><RiskBadge level={riskAnalysis.level} /></div>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${riskAnalysis.level === "BAIXO" ? "bg-green-500" : riskAnalysis.level === "MEDIO" ? "bg-yellow-500" : riskAnalysis.level === "ALTO" ? "bg-orange-500" : "bg-red-500"}`}
            style={{ width: `${riskAnalysis.score}%` }}
          />
        </div>
        {positiveFactors.length > 0 && (
          <div>
            <CyberText variant="caption" className="text-green-400">Fatores que reduzem risco:</CyberText>
            {positiveFactors.map((f, i) => (
              <div key={i} className="flex justify-between items-start py-0.5">
                <CyberText variant="caption" className="text-xs flex-1">{f.factor}</CyberText>
                <span className="font-mono text-xs text-green-400 ml-2 flex-shrink-0">{f.impact}</span>
              </div>
            ))}
          </div>
        )}
        {negativeFactors.length > 0 && (
          <div>
            <CyberText variant="caption" className="text-red-400">Fatores de risco:</CyberText>
            {negativeFactors.map((f, i) => (
              <div key={i} className="flex justify-between items-start py-0.5">
                <CyberText variant="caption" className="text-xs flex-1">{f.factor}</CyberText>
                <span className="font-mono text-xs text-red-400 ml-2 flex-shrink-0">{f.impact}</span>
              </div>
            ))}
          </div>
        )}
        {neutralFactors.length > 0 && (
          <div>
            <CyberText variant="caption" color="muted">Fatores neutros:</CyberText>
            {neutralFactors.map((f, i) => (
              <div key={i} className="flex justify-between items-start py-0.5">
                <CyberText variant="caption" className="text-xs flex-1">{f.factor}</CyberText>
                <span className="font-mono text-xs text-muted-foreground ml-2">+0</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-border/40">
          <CyberText variant="caption" color="muted">Compliance: {complianceData.regulatoryRegion}</CyberText>
          <CyberText variant="caption" className="text-xs mt-1">{complianceData.threeDSMandateLevel} — {complianceData.liabilityShiftExpected ? "Liability shift esperado" : "Sem liability shift garantido"}</CyberText>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card 5: Recommendation ───────────────────────────────────────────────

function RecommendationCard({ result }: { result: BINAnalysisV2Result }) {
  const { finalSummary, riskAnalysis } = result

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-mono text-sm text-secondary neon-glow">
          <Lock className="h-5 w-5" />
          <span>RECOMENDAÇÃO ANTIFRAUDE</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <CyberText className="font-mono font-bold">{finalSummary.title}</CyberText>
          <RecommendationBadge code={riskAnalysis.recommendation} />
        </div>
        <div>
          <CyberText variant="caption" color="muted">Resumo</CyberText>
          <CyberText variant="caption" className="leading-relaxed mt-1 text-xs">
            {finalSummary.message}
          </CyberText>
        </div>
        <div>
          <CyberText variant="caption" color="muted">Ação Recomendada</CyberText>
          <CyberText variant="caption" className="leading-relaxed mt-1 text-xs font-bold">
            {finalSummary.action}
          </CyberText>
        </div>
        {finalSummary.recommendedActions.length > 0 && (
          <div>
            <CyberText variant="caption" color="muted">Ações Específicas</CyberText>
            {finalSummary.recommendedActions.map((action, i) => (
              <div key={i} className="flex items-start gap-1 mt-1">
                <CheckCircle className="h-3 w-3 text-secondary mt-0.5 flex-shrink-0" />
                <CyberText variant="caption" className="text-xs">{action}</CyberText>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-border/40">
          <CyberText variant="caption" color="muted">Resumo Técnico</CyberText>
          <CyberText variant="caption" className="text-xs leading-relaxed mt-1">
            {finalSummary.technicalSummary}
          </CyberText>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────

export function BinAnalysisV2Cards({ result }: BinAnalysisV2CardsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Main card full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MainCard result={result} />
        <ThreeDSCard result={result} />
      </div>
      {/* Row 2: 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataQualityCard result={result} />
        <RiskCard result={result} />
        <RecommendationCard result={result} />
      </div>
    </div>
  )
}
