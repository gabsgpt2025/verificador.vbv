import { Badge } from '@/components/ui/badge'

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE'

type ConfidenceBadgeProps = {
  confidence: ConfidenceLevel
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence === 'HIGH') {
    return <Badge variant="success">Confiança alta</Badge>
  }

  if (confidence === 'MEDIUM') {
    return <Badge variant="warning">Confiança média</Badge>
  }

  if (confidence === 'LOW') {
    return <Badge variant="danger">Confiança baixa</Badge>
  }

  return <Badge variant="outline">Confiança indisponível</Badge>
}

export default ConfidenceBadge
