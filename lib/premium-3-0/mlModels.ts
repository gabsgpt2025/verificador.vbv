// lib/premium-3-0/mlModels.ts
// Static ML model metadata — for real scoring, implement via API in a future PR

// TODO: Replace static model data with real ML model API integration

export interface MLModel {
  name: string
  version: string
  accuracy: number
  lastTrained: string
}

export interface ScoringMetrics {
  precision: number
  recall: number
  f1Score: number
  auc: number
}

const AVAILABLE_MODELS: MLModel[] = [
  {
    name: "FraudDetectionV3",
    version: "3.2.1",
    accuracy: 94.7,
    lastTrained: "2024-08-15",
  },
  {
    name: "RiskAssessmentV2",
    version: "2.1.8",
    accuracy: 91.3,
    lastTrained: "2024-08-10",
  },
]

const MODEL_METRICS: ScoringMetrics = {
  precision: 0.923,
  recall: 0.887,
  f1Score: 0.905,
  auc: 0.941,
}

export function getAvailableModels(): MLModel[] {
  return [...AVAILABLE_MODELS]
}

export function getModelMetrics(): ScoringMetrics {
  return { ...MODEL_METRICS }
}
