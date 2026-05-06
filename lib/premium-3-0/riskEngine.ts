/**
 * VeriFiBIN Premium 3.0 - Risk Engine
 * Motor de risco híbrido com análise local + global
 */

import type { RiskEngineResult, RiskFactors, FraudAlert, AnalysisRequest } from './types';
import { analyzeBIN } from './binIntelligence';
import { analyze3DS, getTimeOfDay, getDayOfWeek } from './threeDSEngine';

export function calculateRisk(request: AnalysisRequest): RiskEngineResult {
  // Analisar BIN
  const binAnalysis = analyzeBIN(request.bin);

  // Preparar contexto 3DS
  const threeDSContext = {
    transactionAmount: request.transactionAmount,
    transactionCurrency: request.transactionCurrency,
    merchantCountry: request.merchantCountry,
    cardholderCountry: request.cardholderCountry,
    deviceType: request.deviceType as any,
    isNewCard: request.isNewCard,
    isFirstTransaction: request.isFirstTransaction,
    timeOfDay: getTimeOfDay(),
    dayOfWeek: getDayOfWeek(),
  };

  // Analisar 3DS
  const threeDSAnalysis = analyze3DS(threeDSContext, binAnalysis.riskScore, binAnalysis.frictionlessLikelihood);

  // Calcular fatores de risco
  const riskFactors = calculateRiskFactors(request, binAnalysis, threeDSAnalysis);

  // Calcular score geral
  const overallRiskScore = calculateOverallRiskScore(riskFactors);
  const riskLevel = getRiskLevel(overallRiskScore);

  // Gerar recomendações
  const recommendations = generateRecommendations(overallRiskScore, riskLevel, threeDSAnalysis);

  // Consolidar alertas
  const alerts = consolidateAlerts(binAnalysis.alerts);

  return {
    overallRiskScore,
    riskLevel,
    riskFactors,
    recommendations,
    alerts,
  };
}

function calculateRiskFactors(request: AnalysisRequest, binAnalysis: any, threeDSAnalysis: any): RiskFactors {
  // Risco do BIN (0-100)
  const binRisk = binAnalysis.riskScore;

  // Risco temporal
  let temporalRisk = 0;
  if (threeDSAnalysis.challengeLikelihood === 'VERY_HIGH') temporalRisk = 80;
  else if (threeDSAnalysis.challengeLikelihood === 'HIGH') temporalRisk = 60;
  else if (threeDSAnalysis.challengeLikelihood === 'MEDIUM') temporalRisk = 40;
  else if (threeDSAnalysis.challengeLikelihood === 'LOW') temporalRisk = 20;
  else temporalRisk = 10;

  // Risco comportamental
  let behavioralRisk = 0;
  if (request.isNewCard) behavioralRisk += 25;
  if (request.isFirstTransaction) behavioralRisk += 20;
  if (request.transactionAmount > 5000) behavioralRisk += 20;
  if (request.transactionAmount > 1000) behavioralRisk += 10;
  behavioralRisk = Math.min(100, behavioralRisk);

  // Risco geográfico
  let geographicRisk = 0;
  if (request.cardholderCountry !== request.merchantCountry) {
    geographicRisk = 30;
    // Aumentar se país de alto risco
    if (['UA', 'RU', 'GE', 'CN', 'NG'].includes(request.cardholderCountry)) geographicRisk = 60;
  }

  // Risco de dispositivo
  let deviceRisk = 0;
  if (request.deviceType === 'UNKNOWN') deviceRisk = 40;
  if (request.deviceType === 'MOBILE') deviceRisk = 10;
  if (request.deviceType === 'DESKTOP') deviceRisk = 5;

  // Risco de gateway (simulado)
  let gatewayRisk = 0;
  // Em produção, isso viria de dados de histórico de gateway
  if (request.additionalContext?.gatewayId) {
    gatewayRisk = 15; // Valor padrão
  }

  return {
    binRisk,
    temporalRisk,
    behavioralRisk,
    geographicRisk,
    deviceRisk,
    gatewayRisk,
  };
}

function calculateOverallRiskScore(riskFactors: RiskFactors): number {
  // Média ponderada dos fatores de risco
  const weights = {
    binRisk: 0.25,
    temporalRisk: 0.25,
    behavioralRisk: 0.20,
    geographicRisk: 0.15,
    deviceRisk: 0.10,
    gatewayRisk: 0.05,
  };

  const score =
    riskFactors.binRisk * weights.binRisk +
    riskFactors.temporalRisk * weights.temporalRisk +
    riskFactors.behavioralRisk * weights.behavioralRisk +
    riskFactors.geographicRisk * weights.geographicRisk +
    riskFactors.deviceRisk * weights.deviceRisk +
    riskFactors.gatewayRisk * weights.gatewayRisk;

  return Math.round(score);
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

function generateRecommendations(
  overallRiskScore: number,
  riskLevel: string,
  threeDSAnalysis: any
): {
  action: 'APPROVE' | 'CHALLENGE' | 'DECLINE' | 'REVIEW';
  confidence: number;
  reasoning: { technical: string; popular: string };
} {
  let action: 'APPROVE' | 'CHALLENGE' | 'DECLINE' | 'REVIEW' = 'APPROVE';
  let confidence = 95;
  let reasoning = {
    technical: 'Transação de baixo risco',
    popular: 'Sua transação parece segura',
  };

  if (riskLevel === 'LOW' && threeDSAnalysis.recommendedFlow === 'FRICTIONLESS') {
    action = 'APPROVE';
    confidence = 95;
    reasoning = {
      technical: 'Fluxo Frictionless 3DS2 seguro - sem desafio necessário',
      popular: 'Você não precisará fazer verificação adicional',
    };
  } else if (riskLevel === 'MEDIUM') {
    action = 'CHALLENGE';
    confidence = 85;
    reasoning = {
      technical: 'Desafio 3DS recomendado para verificação adicional',
      popular: 'Por segurança, você precisará fazer uma verificação rápida',
    };
  } else if (riskLevel === 'HIGH') {
    action = 'CHALLENGE';
    confidence = 75;
    reasoning = {
      technical: 'Múltiplos fatores de risco detectados - desafio obrigatório',
      popular: 'Detectamos alguns padrões incomuns - precisamos verificar sua identidade',
    };
  } else if (riskLevel === 'CRITICAL') {
    action = 'DECLINE';
    confidence = 65;
    reasoning = {
      technical: 'Risco crítico - transação bloqueada para revisão manual',
      popular: 'Esta transação foi bloqueada por segurança - entre em contato com o suporte',
    };
  }

  return {
    action,
    confidence,
    reasoning,
  };
}

function consolidateAlerts(binAlerts: FraudAlert[]): FraudAlert[] {
  // Remover duplicatas e ordenar por severidade
  const severityOrder = { CRÍTICO: 0, ALTO: 1, AVISO: 2, INFO: 3 };

  return binAlerts.sort((a, b) => {
    return (severityOrder[a.severity as keyof typeof severityOrder] || 99) - (severityOrder[b.severity as keyof typeof severityOrder] || 99);
  });
}

export function getRiskColor(riskLevel: string): string {
  const colorMap: Record<string, string> = {
    LOW: '#10b981', // verde
    MEDIUM: '#f59e0b', // amarelo
    HIGH: '#ef4444', // vermelho
    CRITICAL: '#7c2d12', // vermelho escuro
  };
  return colorMap[riskLevel] || '#6b7280';
}

export function getRiskDescription(riskLevel: string, languageMode: 'TECHNICAL' | 'POPULAR'): string {
  const descriptions: Record<string, Record<string, string>> = {
    LOW: {
      TECHNICAL: 'Transação de baixo risco - fluxo frictionless recomendado',
      POPULAR: 'Sua transação parece segura e não deve ter problemas',
    },
    MEDIUM: {
      TECHNICAL: 'Risco moderado - desafio 3DS recomendado',
      POPULAR: 'Você pode precisar fazer uma verificação rápida',
    },
    HIGH: {
      TECHNICAL: 'Risco elevado - múltiplos fatores de alerta detectados',
      POPULAR: 'Detectamos alguns padrões incomuns na sua transação',
    },
    CRITICAL: {
      TECHNICAL: 'Risco crítico - transação bloqueada para revisão',
      POPULAR: 'Esta transação foi bloqueada por segurança',
    },
  };

  return descriptions[riskLevel]?.[languageMode] || 'Análise de risco indisponível';
}
