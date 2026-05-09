export type DisplayConfidence = 'low' | 'medium' | 'high' | 'unavailable'

export type DisplayPolicyInput = {
  score: number
  confidence: DisplayConfidence
  sourcesConfirmed: number
  sourcesTotal: number
}

export type DisplayPolicyOutput = {
  displayValue: string
  precision: 'exact' | 'range' | 'qualitative' | 'hidden'
  warning?: string
}

function clampScore(score: number) {
  return Math.min(Math.max(Math.round(score), 0), 100)
}

function getRiskBand(score: number) {
  if (score < 30) return 'Risco baixo'
  if (score < 60) return 'Risco médio'
  return 'Risco alto'
}

function buildRange(score: number, sourcesConfirmed: number, sourcesTotal: number) {
  const confidenceSpread = Math.max(6, Math.round(((sourcesTotal - sourcesConfirmed) / Math.max(sourcesTotal, 1)) * 20))
  const min = clampScore(score - confidenceSpread)
  const max = clampScore(score + confidenceSpread)
  return `${min}–${max} / 100`
}

export function getScoreDisplayPolicy(input: DisplayPolicyInput): DisplayPolicyOutput {
  const score = clampScore(input.score)

  if (input.confidence === 'unavailable') {
    return {
      displayValue: 'Indisponível',
      precision: 'hidden',
      warning: 'Não foi possível calcular score confiável. Tente novamente.',
    }
  }

  if (input.confidence === 'high') {
    return {
      displayValue: `${score}/100`,
      precision: 'exact',
    }
  }

  if (input.confidence === 'medium') {
    return {
      displayValue: buildRange(score, input.sourcesConfirmed, input.sourcesTotal),
      precision: 'range',
      warning: 'Estimativa baseada em fontes parciais.',
    }
  }

  return {
    displayValue: `${getRiskBand(score)} — análise parcial`,
    precision: 'qualitative',
    warning: 'Estimativa preliminar — pode mudar com mais fontes.',
  }
}

export function shouldMutePercentages(precision: DisplayPolicyOutput['precision']) {
  return precision === 'qualitative' || precision === 'hidden'
}
