import type { AnalysisMode } from "./useAnalysisMode"

export type GlossaryEntry = {
  technical: string
  popular: string
  tooltip: string
}

export const analysisGlossary: GlossaryEntry[] = [
  {
    technical: "ALLOW_WITH_MONITORING",
    popular: "Aprovar e monitorar",
    tooltip: "Liberar a venda mantendo acompanhamento padrão.",
  },
  {
    technical: "ALLOW",
    popular: "Aprovar",
    tooltip: "Transação dentro do esperado, pode liberar.",
  },
  {
    technical: "REVIEW",
    popular: "Revisar manualmente",
    tooltip: "Vale uma análise humana antes de aprovar.",
  },
  {
    technical: "BLOCK",
    popular: "Bloquear",
    tooltip: "Risco alto demais — não aprovar.",
  },
  {
    technical: "DENY",
    popular: "Bloquear",
    tooltip: "Risco alto demais — não aprovar.",
  },
  {
    technical: "BLOCK_PREVENTIVELY",
    popular: "Bloquear",
    tooltip: "Risco alto demais — não aprovar.",
  },
  {
    technical: "PSD2",
    popular: "Regra europeia de pagamento seguro",
    tooltip: "Diretiva da UE que exige autenticação forte.",
  },
  {
    technical: "SCA",
    popular: "Autenticação extra do banco",
    tooltip: "O banco vai pedir senha/app para confirmar o cliente.",
  },
  {
    technical: "BIN comercial (PJ)",
    popular: "Cartão empresarial",
    tooltip: "Cartão de pessoa jurídica — pode ter regras diferentes.",
  },
  {
    technical: "Compliance LOW",
    popular: "Tudo dentro das regras",
    tooltip: "Sem alertas regulatórios relevantes.",
  },
]

const glossaryMap = new Map(analysisGlossary.map((entry) => [entry.technical.toUpperCase(), entry]))

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function findGlossaryEntry(technicalTerm: string): GlossaryEntry | undefined {
  return glossaryMap.get(technicalTerm.toUpperCase())
}

export function formatGlossaryTerm(technicalTerm: string, mode: AnalysisMode): string {
  const entry = findGlossaryEntry(technicalTerm)
  if (!entry) {
    return technicalTerm
  }

  if (mode === "merchant") {
    return entry.popular
  }

  if (mode === "both") {
    return `${entry.popular} (${entry.technical})`
  }

  return entry.technical
}

export function translateGlossaryText(text: string, mode: AnalysisMode): string {
  if (!text) {
    return text
  }

  return [...analysisGlossary]
    .sort((a, b) => b.technical.length - a.technical.length)
    .reduce((acc, entry) => {
      const replacement = formatGlossaryTerm(entry.technical, mode)
      return acc.replace(new RegExp(escapeRegex(entry.technical), "gi"), replacement)
    }, text)
}
