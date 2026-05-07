/**
 * VeriFiBIN Premium 3.0 - BIN Intelligence Engine
 * Motor de análise de BIN com dados proprietários e integração Mastercard
 */

import type { BINData, BINAnalysisResult, FraudAlert } from './types';

// Base de dados proprietária de emissores com dados de bypass e frictionless
const ISSUER_INTELLIGENCE_DB: Record<string, any> = {
  // Bancos Brasileiros
  '627961': {
    issuerName: 'Nubank',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'HIGH',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'LOW',
  },
  '627593': {
    issuerName: 'Itaú',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'GOLD',
    frictionlessLikelihood: 'MEDIUM',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'LOW',
  },
  '627649': {
    issuerName: 'Bradesco',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'MEDIUM',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'LOW',
  },
  '627495': {
    issuerName: 'Caixa',
    country: 'BR',
    productType: 'DEBIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'LOW',
    bypassMechanism: 'NONE',
    riskProfile: 'MEDIUM',
  },
  '627747': {
    issuerName: 'Inter',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'VERY_HIGH',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'LOW',
  },
  // Fintechs e White-labels
  '627988': {
    issuerName: 'Next',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'VERY_HIGH',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'MEDIUM',
  },
  '627450': {
    issuerName: 'Neon',
    country: 'BR',
    productType: 'DEBIT',
    cardLevel: 'STANDARD',
    frictionlessLikelihood: 'MEDIUM',
    bypassMechanism: 'FRICTIONLESS_3DS2',
    riskProfile: 'MEDIUM',
  },
  // Cartões Corporativos (Isenção SCA B2B)
  '627999': {
    issuerName: 'Corporate Card - Mastercard',
    country: 'BR',
    productType: 'CREDIT',
    cardLevel: 'PLATINUM',
    frictionlessLikelihood: 'VERY_HIGH',
    bypassMechanism: 'SCA_EXEMPTION',
    riskProfile: 'LOW',
    isCorporate: true,
  },
};

export function analyzeBIN(bin: string): BINAnalysisResult {
  const binPrefix = bin.substring(0, 6);
  const issuerData = ISSUER_INTELLIGENCE_DB[binPrefix];

  // Dados padrão se não encontrado
  const binData: BINData = issuerData || {
    bin: binPrefix,
    country: 'UNKNOWN',
    issuerName: 'Unknown Issuer',
    productType: 'UNKNOWN',
    cardLevel: 'UNKNOWN',
    isReloadable: false,
    issuingNetwork: 'MASTERCARD',
    lastUpdated: new Date().toISOString(),
  };

  // Calcular score de risco baseado no BIN
  const riskScore = calculateBINRiskScore(binData);
  const riskLevel = getRiskLevel(riskScore);

  // Determinar likelihood de frictionless
  const frictionlessLikelihood = issuerData?.frictionlessLikelihood || 'MEDIUM';
  const bypassMechanism = issuerData?.bypassMechanism || 'NONE';

  // Gerar alertas
  const alerts = generateBINAlerts(binData, issuerData);

  // Recomendações
  const recommendations = generateBINRecommendations(binData, riskScore);

  return {
    bin: binPrefix,
    binData,
    riskScore,
    riskLevel,
    frictionlessLikelihood: frictionlessLikelihood as any,
    bypassMechanism: bypassMechanism as any,
    alerts,
    recommendations,
  };
}

function calculateBINRiskScore(binData: BINData): number {
  let score = 0;

  // Risco por país
  const countryRiskMap: Record<string, number> = {
    BR: 15,
    US: 10,
    GB: 8,
    UA: 45,
    RU: 50,
    GE: 40,
    KZ: 35,
    BY: 48,
    CN: 55,
    NG: 60,
  };

  score += countryRiskMap[binData.country] || 25;

  // Risco por tipo de produto
  if (binData.productType === 'PREPAID') score += 20;
  if (binData.productType === 'DEBIT') score += 5;

  // Risco por nível do cartão
  if (binData.cardLevel === 'STANDARD') score += 10;
  if (binData.cardLevel === 'PLATINUM' || binData.cardLevel === 'BLACK') score -= 10;

  // Risco por recarregabilidade
  if (binData.isReloadable) score += 15;

  return Math.min(100, Math.max(0, score));
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

function generateBINAlerts(binData: BINData, issuerData: any): FraudAlert[] {
  const alerts: FraudAlert[] = [];

  // Alerta: País de alto risco
  if (['UA', 'RU', 'GE', 'KZ', 'BY', 'CN', 'NG'].includes(binData.country)) {
    alerts.push({
      id: `alert-${Date.now()}-1`,
      category: 'CONFORMIDADE',
      severity: 'ALTO',
      title: 'País de Alto Risco Detectado',
      description: {
        technical: `BIN emitido em país com perfil de risco elevado: ${binData.country}`,
        popular: `Este cartão foi emitido em um país com histórico de fraude elevado.`,
      },
      riskImpact: 30,
      detectionMethod: 'GEO_RISK_PROFILE',
      timestamp: new Date().toISOString(),
    });
  }

  // Alerta: Cartão pré-pago
  if (binData.productType === 'PREPAID') {
    alerts.push({
      id: `alert-${Date.now()}-2`,
      category: 'COMPORTAMENTO_3DS',
      severity: 'AVISO',
      title: 'Cartão Pré-pago Detectado',
      description: {
        technical: 'Cartões pré-pagos apresentam maior risco de fraude por falta de verificação KYC robusta',
        popular: 'Cartões pré-pagos podem ser mais fáceis de usar de forma fraudulenta.',
      },
      riskImpact: 20,
      detectionMethod: 'PRODUCT_TYPE_ANALYSIS',
      timestamp: new Date().toISOString(),
    });
  }

  // Alerta: Cartão recarregável
  if (binData.isReloadable) {
    alerts.push({
      id: `alert-${Date.now()}-3`,
      category: 'COMPORTAMENTO_3DS',
      severity: 'AVISO',
      title: 'Cartão Recarregável Detectado',
      description: {
        technical: 'Cartões recarregáveis podem ser usados múltiplas vezes em fraudes',
        popular: 'Este tipo de cartão pode ser reutilizado em múltiplas transações fraudulentas.',
      },
      riskImpact: 15,
      detectionMethod: 'PRODUCT_CHARACTERISTICS',
      timestamp: new Date().toISOString(),
    });
  }

  // Alerta: Cartão corporativo (baixo risco)
  if (issuerData?.isCorporate) {
    alerts.push({
      id: `alert-${Date.now()}-4`,
      category: 'CONFORMIDADE',
      severity: 'INFO',
      title: 'Cartão Corporativo B2B Detectado',
      description: {
        technical: 'Cartão corporativo com isenção SCA PSD2 para transações B2B',
        popular: 'Este é um cartão corporativo que pode ter regras especiais de segurança.',
      },
      riskImpact: -20,
      detectionMethod: 'ISSUER_PROFILE',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}

function generateBINRecommendations(binData: BINData, riskScore: number): string[] {
  const recommendations: string[] = [];

  if (riskScore > 70) {
    recommendations.push('Recomendação: Exigir desafio 3DS obrigatório');
    recommendations.push('Recomendação: Verificação adicional de identidade recomendada');
  }

  if (binData.productType === 'PREPAID') {
    recommendations.push('Recomendação: Limitar valor de transação para cartões pré-pagos');
  }

  if (['UA', 'RU', 'GE', 'CN'].includes(binData.country)) {
    recommendations.push('Recomendação: Aplicar regras de conformidade mais rigorosas');
  }

  if (riskScore < 30) {
    recommendations.push('Recomendação: Fluxo frictionless pode ser considerado seguro');
  }

  return recommendations;
}

export function getBINFromCard(cardNumber: string): string {
  return cardNumber.substring(0, 6);
}

export function validateBIN(bin: string): boolean {
  return /^\d{6}$/.test(bin);
}
