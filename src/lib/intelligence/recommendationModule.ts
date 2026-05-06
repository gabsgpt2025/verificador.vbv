// VeriFiBIN 2.0 — Recommendation Module
// Generates professional anti-fraud recommendations based on analysis results

import type {
  FinalSummary,
  RecommendationCode,
  RiskLevel,
  ThreeDSStatus,
  ConfidenceLevel,
} from "./types"

export interface RecommendationInput {
  recommendation: RecommendationCode
  riskLevel: RiskLevel
  riskScore: number
  threeDSStatus: ThreeDSStatus
  threeDSConfidence: ConfidenceLevel
  issuerKnown: boolean
  countryKnown: boolean
  dataQualityScore: number
  isPrepaid: boolean
  isCommercial: boolean
  missingFields: string[]
  warnings: string[]
}

function buildRecommendedActions(input: RecommendationInput): string[] {
  const actions: string[] = []

  if (input.recommendation === "DADOS_INSUFICIENTES") {
    actions.push("Solicitar verificação manual dos dados do cartão")
    actions.push("Consultar API de BIN adicional para enriquecer dados")
    return actions
  }

  if (input.recommendation === "BLOQUEAR_PREVENTIVAMENTE") {
    actions.push("Bloquear transação preventivamente e acionar equipe de revisão")
    actions.push("Solicitar verificação de identidade adicional ao portador")
    actions.push("Registrar ocorrência para análise de padrão de fraude")
    return actions
  }

  if (input.recommendation === "EXIGIR_3DS") {
    actions.push("Exigir autenticação 3DS antes de aprovar a transação")
    actions.push("Aplicar regras antifraude adicionais para este BIN")
    if (input.isPrepaid) {
      actions.push("Cartão pré-pago detectado — aplicar limites de transação reduzidos")
    }
    return actions
  }

  if (input.recommendation === "REVISAR") {
    actions.push("Revisar transação manualmente ou via regras automáticas")
    if (!input.issuerKnown) {
      actions.push("Emissor não identificado — consultar base de dados adicional")
    }
    if (input.isPrepaid) {
      actions.push("Cartão pré-pago — monitorar padrão de uso")
    }
    if (input.missingFields.length > 0) {
      actions.push(`Enriquecer dados ausentes: ${input.missingFields.slice(0, 3).join(", ")}`)
    }
  }

  if (input.recommendation === "APROVAR_COM_SEGURANCA") {
    actions.push("Transação pode prosseguir com monitoramento padrão")
    actions.push("Registrar análise para auditoria de compliance")
  }

  return actions
}

function buildTitle(input: RecommendationInput): string {
  const { recommendation, threeDSStatus, threeDSConfidence } = input

  if (recommendation === "DADOS_INSUFICIENTES") {
    return "Dados insuficientes para análise conclusiva"
  }

  if (threeDSStatus === "ATIVO_PROVAVEL" && threeDSConfidence === "ALTA") {
    return "Cartão com suporte 3DS provável — alta confiança"
  }
  if (threeDSStatus === "ATIVO_PROVAVEL" && threeDSConfidence === "MEDIA") {
    return "Cartão com suporte 3DS provavelmente ativo"
  }
  if (threeDSStatus === "INATIVO_PROVAVEL") {
    return "Cartão com baixa probabilidade de 3DS ativo"
  }
  if (recommendation === "BLOQUEAR_PREVENTIVAMENTE") {
    return "Perfil de alto risco — bloqueio preventivo recomendado"
  }
  if (recommendation === "EXIGIR_3DS") {
    return "Exigir autenticação 3DS para este cartão"
  }

  return "Análise de risco concluída"
}

function buildMessage(input: RecommendationInput): string {
  const parts: string[] = []

  if (input.threeDSStatus === "ATIVO_PROVAVEL") {
    parts.push(
      `A análise indica suporte provável a 3DS/VBV com confiança ${input.threeDSConfidence.toLowerCase()}.`,
    )
  } else if (input.threeDSStatus === "INATIVO_PROVAVEL") {
    parts.push("A análise indica baixa probabilidade de 3DS ativo neste cartão.")
  } else {
    parts.push("Status 3DS não determinado com confiança suficiente.")
  }

  if (!input.issuerKnown) {
    parts.push("Ausência do emissor na resposta da API reduz a precisão da análise.")
  }

  if (input.warnings.length > 0) {
    parts.push(`Alertas: ${input.warnings[0]}`)
  }

  parts.push(
    "⚠️ Status 3DS é uma estimativa inferida — não confirmada diretamente pela API de BIN.",
  )

  return parts.join(" ")
}

function buildAction(input: RecommendationInput): string {
  switch (input.recommendation) {
    case "APROVAR_COM_SEGURANCA":
      return "Transação pode ser processada com monitoramento padrão antifraude."
    case "REVISAR":
      return "Revisar manualmente ou aplicar autenticação adicional em transações de maior valor."
    case "EXIGIR_3DS":
      return "Exigir autenticação 3DS antes de processar a transação."
    case "BLOQUEAR_PREVENTIVAMENTE":
      return "Bloquear preventivamente e encaminhar para revisão manual."
    case "DADOS_INSUFICIENTES":
      return "Coletar mais dados antes de tomar decisão de aprovação ou recusa."
  }
}

function buildTechnicalSummary(input: RecommendationInput): string {
  return [
    `Score de risco: ${input.riskScore}/100 (${input.riskLevel}).`,
    `Status 3DS estimado: ${input.threeDSStatus} (confiança ${input.threeDSConfidence}).`,
    `Qualidade dos dados: ${input.dataQualityScore}/100.`,
    `Todos os dados de 3DS são inferências algorítmicas — não confirmados por API.`,
    `Baseado em: país de emissão, bandeira, tipo, categoria e emissor.`,
  ].join(" ")
}

export function buildFinalSummary(input: RecommendationInput): FinalSummary {
  const recommendedActions = buildRecommendedActions(input)
  const title = buildTitle(input)
  const message = buildMessage(input)
  const action = buildAction(input)
  const technicalSummary = buildTechnicalSummary(input)
  const userFriendlySummary = message

  return {
    title,
    message,
    action,
    userFriendlySummary,
    technicalSummary,
    recommendedActions,
  }
}
