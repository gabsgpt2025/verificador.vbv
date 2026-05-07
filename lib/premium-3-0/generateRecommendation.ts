// lib/premium-3-0/generateRecommendation.ts
// Gera recomendação final baseada na análise completa

import type { FullBinAnalysis } from "./types"

type FinalSummary = {
  title: string
  message: string
  action: string
}

export function generateRecommendation(analysis: Omit<FullBinAnalysis, "finalSummary">): FinalSummary {
  const { riskAnalysis, threeDSAnalysis, dataQuality } = analysis

  if (riskAnalysis.recommendation === "INSUFFICIENT_DATA") {
    return {
      title: "Dados insuficientes para análise",
      message: "A BIN não possui dados mínimos para classificação de risco confiável.",
      action: "Exigir autenticação adicional ou revisar manualmente antes de processar.",
    }
  }

  if (riskAnalysis.level === "CRITICAL" || riskAnalysis.recommendation === "BLOCK_PREVENTIVELY") {
    return {
      title: "Risco crítico — bloqueio preventivo recomendado",
      message:
        "A BIN apresenta múltiplos fatores de risco relevantes, como dados incompletos, baixa maturidade 3DS ou suporte incerto à autenticação.",
      action:
        "Bloquear preventivamente ou exigir revisão manual completa antes de qualquer processamento.",
    }
  }

  if (riskAnalysis.level === "HIGH" || riskAnalysis.recommendation === "REQUIRE_3DS") {
    return {
      title: "Risco elevado — autenticação adicional recomendada",
      message:
        "A BIN apresenta fatores de risco relevantes, como dados incompletos, baixa maturidade 3DS ou suporte incerto.",
      action: "Exigir 3DS, revisar manualmente ou aplicar regras antifraude adicionais.",
    }
  }

  if (riskAnalysis.level === "MEDIUM" || riskAnalysis.recommendation === "REVIEW") {
    const inferred = threeDSAnalysis.inferred ? " Status 3DS inferido, não confirmado pela API." : ""
    return {
      title: "Revisão recomendada",
      message: `A BIN possui dados parcialmente confiáveis ou status 3DS não confirmado.${inferred}`,
      action: "Revisar contexto da transação antes da decisão automática.",
    }
  }

  // LOW risk — dataQuality is part of the destructured type but not needed in this branch
  void dataQuality
  return {
    title: "Baixo risco estimado — monitoramento padrão",
    message:
      "A BIN possui dados consistentes e suporte provável a autenticação. Risco estimado dentro de parâmetros normais.",
    action: "Permitir com monitoramento antifraude padrão.",
  }
}
