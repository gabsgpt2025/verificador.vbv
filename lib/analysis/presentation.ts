import type { FullBinAnalysis, RiskFactor } from "@/lib/bin/types"

export type RiskSegment = {
  label: string
  color: string
  min: number
  max: number
  icon: string
  severityLabel: string
}

export const riskSegments: RiskSegment[] = [
  { label: "Baixo", color: "#22c55e", min: 0, max: 20, icon: "🟢", severityLabel: "muito baixo" },
  { label: "Médio", color: "#eab308", min: 21, max: 50, icon: "🟡", severityLabel: "médio" },
  { label: "Alto", color: "#f97316", min: 51, max: 75, icon: "🟠", severityLabel: "alto" },
  { label: "Crítico", color: "#ef4444", min: 76, max: 100, icon: "🔴", severityLabel: "crítico" },
]

export function getRiskSegment(score: number): RiskSegment {
  return riskSegments.find((segment) => score >= segment.min && score <= segment.max) ?? riskSegments[3]
}

export function buildExecutiveHeadline(analysis: FullBinAnalysis): string {
  const recommendation = analysis.riskAnalysis.recommendation

  if (recommendation === "ALLOW_WITH_MONITORING") {
    return "BIN confiável — pode aprovar a venda"
  }

  if (recommendation === "REVIEW") {
    return "BIN com atenção — vale revisar antes de aprovar"
  }

  if (recommendation === "REQUIRE_3DS") {
    return "BIN com risco elevado — peça autenticação extra"
  }

  if (recommendation === "BLOCK_PREVENTIVELY") {
    return "BIN crítico — melhor bloquear a transação"
  }

  return "Dados insuficientes — revisar com cuidado"
}

export function buildExecutiveDescription(analysis: FullBinAnalysis): string {
  const country = analysis.technicalData.countryName ?? analysis.technicalData.countryCode ?? "país não identificado"
  const brand = analysis.technicalData.brand ?? "bandeira não identificada"
  const cardType = analysis.technicalData.type ?? "tipo não identificado"

  return `${country} • ${brand} • ${cardType}`
}

export function buildMerchantActions(analysis: FullBinAnalysis): string[] {
  const recommendation = analysis.riskAnalysis.recommendation

  if (recommendation === "ALLOW_WITH_MONITORING") {
    return [
      "✅ Pode liberar o pedido",
      "📦 Despachar normalmente",
      "🚨 Desconfiar se o endereço ou valor fugirem do padrão",
    ]
  }

  if (recommendation === "REVIEW") {
    return [
      "🕵️ Revisar manualmente antes da aprovação",
      "📞 Confirmar dados com o cliente se necessário",
      "🚨 Se houver sinais fora do padrão, não despachar",
    ]
  }

  if (recommendation === "REQUIRE_3DS") {
    return [
      "🔐 Solicitar autenticação extra do banco",
      "⏳ Só aprovar após confirmação do cliente",
      "🚨 Bloquear se falhar na autenticação",
    ]
  }

  return [
    "🛑 Não aprovar a transação automaticamente",
    "🧾 Registrar tentativa para auditoria",
    "🔎 Revisar contexto completo antes de qualquer liberação",
  ]
}

export function buildAnalystActions(analysis: FullBinAnalysis): string[] {
  const actions = [
    "Registrar trilha de auditoria da decisão",
    "Aplicar velocity check por BIN/IP/dispositivo",
  ]

  if (analysis.riskAnalysis.score >= 50) {
    actions.push("Escalar para revisão manual acima do ticket de risco")
  } else {
    actions.push("Reavaliar automaticamente apenas para tickets fora da média")
  }

  return actions
}

export function buildWhyThisScore(analysis: FullBinAnalysis): string {
  const segment = getRiskSegment(analysis.riskAnalysis.score)
  const country = analysis.technicalData.countryName ?? analysis.technicalData.countryCode ?? "país não identificado"
  const brand = analysis.technicalData.brand ?? "bandeira não identificada"
  const cardType = analysis.technicalData.type ?? "tipo não identificado"
  const compliance = analysis.compliance.threeDSMandateLevel
  const topRisk = analysis.riskAnalysis.factors.find((factor) => factor.impact > 0)
  const topProtection = analysis.riskAnalysis.factors.find((factor) => factor.impact < 0)

  const highlights: string[] = []
  if (topProtection) {
    highlights.push(`ponto a favor: ${topProtection.reason}`)
  }
  if (topRisk) {
    highlights.push(`ressalva: ${topRisk.reason}`)
  }

  const highlightsText = highlights.length > 0 ? ` Observações: ${highlights.join(" ")}` : ""

  return `Demos nota ${analysis.riskAnalysis.score}/100 (risco ${segment.severityLabel}) porque o BIN ${analysis.bin} é de um cartão ${cardType} ${brand} emitido em ${country}, com nível regulatório ${compliance}.${highlightsText}`
}

export function groupRiskFactors(factors: RiskFactor[]): { favorable: RiskFactor[]; attention: RiskFactor[] } {
  return {
    favorable: factors.filter((factor) => factor.impact < 0),
    attention: factors.filter((factor) => factor.impact >= 0),
  }
}
