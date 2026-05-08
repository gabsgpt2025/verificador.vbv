export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 20) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}
