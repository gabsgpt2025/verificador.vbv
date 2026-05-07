/**
 * VeriFiBIN Premium 3.0 - 3DS Analysis Engine
 * Motor de análise de 3DS com detecção de frictionless e bypass
 */

import type { ThreeDSContext, ThreeDSAnalysis } from './types';

export function analyze3DS(context: ThreeDSContext, binRiskScore: number, frictionlessLikelihood: string): ThreeDSAnalysis {
  // Calcular probabilidade de desafio
  const challengeScore = calculateChallengeScore(context, binRiskScore);
  const challengeLikelihood = getChallengeLikelihood(challengeScore);

  // Calcular probabilidade de frictionless
  const frictionlessScore = calculateFrictionlessScore(context, binRiskScore, frictionlessLikelihood);
  const calculatedFrictionlessLikelihood = getFrictionlessLikelihood(frictionlessScore);

  // Determinar fluxo recomendado
  const recommendedFlow = determineRecommendedFlow(challengeScore, frictionlessScore);

  // Estimar taxa de sucesso
  const estimatedSuccessRate = calculateSuccessRate(challengeScore, frictionlessScore, context);

  // Gerar explicações
  const explanation = generateExplanation(context, challengeScore, frictionlessScore, recommendedFlow);

  return {
    challengeLikelihood,
    frictionlessLikelihood: calculatedFrictionlessLikelihood,
    recommendedFlow,
    estimatedSuccessRate,
    explanation,
  };
}

function calculateChallengeScore(context: ThreeDSContext, binRiskScore: number): number {
  let score = 0;

  // Risco do BIN
  score += binRiskScore * 0.3;

  // Risco temporal
  if (context.timeOfDay === 'NIGHT') score += 15;
  if (context.dayOfWeek === 'SUNDAY' || context.dayOfWeek === 'SATURDAY') score += 10;

  // Risco geográfico
  if (context.cardholderCountry !== context.merchantCountry) {
    score += 20;
  }

  // Risco de novo cartão
  if (context.isNewCard) score += 25;

  // Risco de primeira transação
  if (context.isFirstTransaction) score += 20;

  // Risco de valor alto
  if (context.transactionAmount > 1000) score += 15;
  if (context.transactionAmount > 5000) score += 25;

  // Risco de dispositivo
  if (context.deviceType === 'UNKNOWN') score += 10;

  return Math.min(100, Math.max(0, score));
}

function calculateFrictionlessScore(context: ThreeDSContext, binRiskScore: number, frictionlessLikelihood: string): number {
  let score = 50; // Base 50

  // Ajuste por likelihood do BIN
  const frictionlessMap: Record<string, number> = {
    VERY_LOW: -30,
    LOW: -15,
    MEDIUM: 0,
    HIGH: 15,
    VERY_HIGH: 30,
  };
  score += frictionlessMap[frictionlessLikelihood] || 0;

  // Ajuste por risco do BIN
  score -= binRiskScore * 0.2;

  // Ajuste por contexto
  if (context.isNewCard) score -= 20;
  if (context.isFirstTransaction) score -= 15;
  if (context.transactionAmount > 1000) score -= 10;

  // Ajuste por tempo
  if (context.timeOfDay === 'MORNING' || context.timeOfDay === 'AFTERNOON') score += 10;
  if (context.timeOfDay === 'NIGHT') score -= 15;

  // Ajuste por dia da semana
  if (context.dayOfWeek === 'SUNDAY' || context.dayOfWeek === 'SATURDAY') score -= 10;

  // Ajuste por localização
  if (context.cardholderCountry === context.merchantCountry) score += 15;

  // Ajuste por dispositivo
  if (context.deviceType === 'MOBILE') score += 5;
  if (context.deviceType === 'UNKNOWN') score -= 10;

  return Math.min(100, Math.max(0, score));
}

function getChallengeLikelihood(score: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
  if (score < 15) return 'VERY_LOW';
  if (score < 35) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'VERY_HIGH';
}

function getFrictionlessLikelihood(score: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
  if (score < 20) return 'VERY_LOW';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 80) return 'HIGH';
  return 'VERY_HIGH';
}

function determineRecommendedFlow(challengeScore: number, frictionlessScore: number): 'FRICTIONLESS' | 'CHALLENGE' | 'HYBRID' {
  if (frictionlessScore > 70 && challengeScore < 30) {
    return 'FRICTIONLESS';
  }
  if (challengeScore > 70) {
    return 'CHALLENGE';
  }
  return 'HYBRID';
}

function calculateSuccessRate(challengeScore: number, frictionlessScore: number, context: ThreeDSContext): number {
  let successRate = 80; // Base 80%

  // Penalidade por desafio
  if (challengeScore > 70) successRate -= 15;
  if (challengeScore > 85) successRate -= 10;

  // Bônus por frictionless
  if (frictionlessScore > 70) successRate += 10;

  // Ajustes por contexto
  if (context.isNewCard) successRate -= 10;
  if (context.isFirstTransaction) successRate -= 8;
  if (context.transactionAmount > 5000) successRate -= 5;

  return Math.min(100, Math.max(0, successRate));
}

function generateExplanation(
  context: ThreeDSContext,
  challengeScore: number,
  frictionlessScore: number,
  recommendedFlow: string
): { technical: string; popular: string } {
  const factors: string[] = [];
  const factorsPopular: string[] = [];

  // Fatores técnicos
  if (context.isNewCard) {
    factors.push('Novo cartão detectado (risco elevado)');
    factorsPopular.push('Este é um cartão novo');
  }

  if (context.isFirstTransaction) {
    factors.push('Primeira transação do usuário (risco elevado)');
    factorsPopular.push('Esta é a primeira compra com este cartão');
  }

  if (context.cardholderCountry !== context.merchantCountry) {
    factors.push(`Transação cross-border: ${context.cardholderCountry} → ${context.merchantCountry}`);
    factorsPopular.push('Você está comprando de um país diferente');
  }

  if (context.transactionAmount > 1000) {
    factors.push(`Valor elevado: ${context.transactionAmount} ${context.transactionCurrency}`);
    factorsPopular.push('O valor da compra é bastante alto');
  }

  if (context.timeOfDay === 'NIGHT') {
    factors.push('Transação realizada durante a noite (padrão atípico)');
    factorsPopular.push('A compra foi feita durante a noite');
  }

  if (context.deviceType === 'UNKNOWN') {
    factors.push('Tipo de dispositivo desconhecido');
    factorsPopular.push('Não conseguimos identificar seu dispositivo');
  }

  const technicalExplanation =
    recommendedFlow === 'FRICTIONLESS'
      ? `Fluxo Frictionless 3DS2 recomendado. Fatores positivos: ${factors.length === 0 ? 'Transação de baixo risco' : factors.join('; ')}`
      : recommendedFlow === 'CHALLENGE'
        ? `Desafio 3DS recomendado. Fatores de risco: ${factors.join('; ')}`
        : `Fluxo Híbrido recomendado. Análise: ${factors.join('; ')}`;

  const popularExplanation =
    recommendedFlow === 'FRICTIONLESS'
      ? `Sua transação parece segura, então você não precisará fazer verificação adicional. ${factorsPopular.length > 0 ? 'Motivos: ' + factorsPopular.join(', ') : ''}`
      : recommendedFlow === 'CHALLENGE'
        ? `Por segurança, você precisará fazer uma verificação adicional. ${factorsPopular.length > 0 ? 'Motivos: ' + factorsPopular.join(', ') : ''}`
        : `Sua transação pode precisar de verificação adicional dependendo do banco. ${factorsPopular.length > 0 ? 'Motivos: ' + factorsPopular.join(', ') : ''}`;

  return {
    technical: technicalExplanation,
    popular: popularExplanation,
  };
}

export function getTimeOfDay(): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

export function getDayOfWeek(): 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[new Date().getDay()] as any;
}
