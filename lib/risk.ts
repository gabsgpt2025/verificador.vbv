/**
 * Converte score numérico de risco em nível semântico.
 * Faixas: 0-20 (low), 21-50 (medium), 51-75 (high), 76+ (critical).
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 20) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}
