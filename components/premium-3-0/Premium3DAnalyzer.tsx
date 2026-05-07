'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, Globe, Zap, Shield, TrendingUp } from 'lucide-react';
import { calculateRisk } from '@/lib/premium-3-0/riskEngine';
import { analyzeBIN } from '@/lib/premium-3-0/binIntelligence';
import { analyze3DS, getTimeOfDay, getDayOfWeek } from '@/lib/premium-3-0/threeDSEngine';
import type { AnalysisRequest, AnalysisResponse, LanguageMode } from '@/lib/premium-3-0/types';

const LANGUAGE_MODES: Record<string, LanguageMode> = {
  TECHNICAL: {
    mode: 'TECHNICAL',
    label: 'Modo Técnico',
    description: 'Linguagem especializada para profissionais de segurança',
  },
  POPULAR: {
    mode: 'POPULAR',
    label: 'Modo Popular',
    description: 'Linguagem simples e acessível para todos',
  },
};

export default function Premium3DAnalyzer() {
  const [languageMode, setLanguageMode] = useState<'TECHNICAL' | 'POPULAR'>('TECHNICAL');
  const [cardNumber, setCardNumber] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!cardNumber || cardNumber.length < 6) {
      setError('Por favor, insira pelo menos os 6 primeiros dígitos do cartão');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: AnalysisRequest = {
        bin: cardNumber.substring(0, 6),
        transactionAmount: 500,
        transactionCurrency: 'BRL',
        merchantCountry: 'BR',
        cardholderCountry: 'BR',
        deviceType: 'DESKTOP',
        isNewCard: false,
        isFirstTransaction: false,
      };

      const riskAnalysis = calculateRisk(request);
      const binAnalysis = analyzeBIN(request.bin);

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

      const threeDSAnalysis = analyze3DS(threeDSContext, binAnalysis.riskScore, binAnalysis.frictionlessLikelihood);

      const response: AnalysisResponse = {
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString(),
        binAnalysis,
        threeDSAnalysis,
        riskAnalysis,
        languageMode: LANGUAGE_MODES[languageMode],
      };

      setAnalysis(response);
    } catch (err) {
      setError('Erro ao analisar o cartão. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cardNumber, languageMode]);

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-50 border-green-200 text-green-900',
      MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      HIGH: 'bg-red-50 border-red-200 text-red-900',
      CRITICAL: 'bg-red-900 border-red-950 text-red-50',
    };
    return colors[level] || 'bg-gray-50';
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'CRITICAL':
        return <XCircle className="w-5 h-5 text-red-50" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">VeriFiBIN Premium 3.0</h1>
        <p className="text-lg text-gray-600">
          Motor de verificação de segurança anti-fraude com análise de BIN, 3DS e detecção de frictionless
        </p>
      </div>

      {/* Language Toggle */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            Modo de Linguagem
          </CardTitle>
          <CardDescription>
            Escolha entre linguagem técnica especializada ou popular e acessível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {Object.entries(LANGUAGE_MODES).map(([key, mode]) => (
              <Button
                key={key}
                variant={languageMode === key ? 'default' : 'outline'}
                onClick={() => setLanguageMode(key as any)}
                className="flex-1"
              >
                {mode.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {LANGUAGE_MODES[languageMode].description}
          </p>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Analisar Cartão
          </CardTitle>
          <CardDescription>
            Insira os 6 primeiros dígitos do cartão (BIN) para análise de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Insira o BIN (ex: 627961)"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={loading} size="lg">
              {loading ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysis && (
        <div className="space-y-6">
          {/* Risk Score Card */}
          <Card className={`border-2 ${getRiskColor(analysis.riskAnalysis.riskLevel)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskIcon(analysis.riskAnalysis.riskLevel)}
                  <div>
                    <CardTitle>Score de Risco</CardTitle>
                    <CardDescription>
                      {languageMode === 'TECHNICAL'
                        ? 'Análise de risco geral da transação'
                        : 'Nível de segurança da transação'}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{analysis.riskAnalysis.overallRiskScore}</div>
                  <Badge variant="secondary">{analysis.riskAnalysis.riskLevel}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {analysis.riskAnalysis.recommendations.reasoning[languageMode.toLowerCase() as keyof typeof analysis.riskAnalysis.recommendations.reasoning]}
              </p>
            </CardContent>
          </Card>

          {/* BIN Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Análise de BIN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Emissor</p>
                  <p className="font-semibold text-sm">{analysis.binAnalysis.binData.issuerName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">País</p>
                  <p className="font-semibold text-sm">{analysis.binAnalysis.binData.country}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Tipo de Produto</p>
                  <p className="font-semibold text-sm">{analysis.binAnalysis.binData.productType}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Nível</p>
                  <p className="font-semibold text-sm">{analysis.binAnalysis.binData.cardLevel}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold mb-2">Mecanismo de Bypass</p>
                <p className="text-sm font-mono text-blue-900">{analysis.binAnalysis.bypassMechanism}</p>
              </div>
            </CardContent>
          </Card>

          {/* 3DS Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análise 3DS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-semibold mb-2">Probabilidade de Frictionless</p>
                  <p className="text-2xl font-bold text-green-900">{analysis.threeDSAnalysis.frictionlessLikelihood}</p>
                  <p className="text-xs text-green-700 mt-2">
                    {languageMode === 'TECHNICAL'
                      ? 'Fluxo sem desafio 3DS'
                      : 'Transação sem verificação adicional'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold mb-2">Probabilidade de Desafio</p>
                  <p className="text-2xl font-bold text-orange-900">{analysis.threeDSAnalysis.challengeLikelihood}</p>
                  <p className="text-xs text-orange-700 mt-2">
                    {languageMode === 'TECHNICAL'
                      ? 'Fluxo com desafio 3DS'
                      : 'Transação com verificação'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-600 font-semibold mb-2">Fluxo Recomendado</p>
                <p className="text-lg font-bold text-purple-900 mb-2">{analysis.threeDSAnalysis.recommendedFlow}</p>
                <p className="text-sm text-purple-800">
                  {analysis.threeDSAnalysis.explanation[languageMode.toLowerCase() as keyof typeof analysis.threeDSAnalysis.explanation]}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {analysis.riskAnalysis.alerts.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Alertas Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.riskAnalysis.alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-red-900">{alert.title}</p>
                        <Badge variant="destructive">{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-red-800">
                        {alert.description[languageMode.toLowerCase() as keyof typeof alert.description]}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.riskAnalysis.recommendations.action === 'APPROVE' && (
                  <li className="flex items-start gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      {languageMode === 'TECHNICAL'
                        ? 'Fluxo Frictionless 3DS2 seguro - transação pode ser aprovada sem desafio'
                        : 'Sua transação parece segura - pode ser aprovada sem verificação adicional'}
                    </span>
                  </li>
                )}
                {analysis.riskAnalysis.recommendations.action === 'CHALLENGE' && (
                  <li className="flex items-start gap-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      {languageMode === 'TECHNICAL'
                        ? 'Desafio 3DS recomendado para verificação adicional'
                        : 'Por segurança, uma verificação adicional é recomendada'}
                    </span>
                  </li>
                )}
                {analysis.riskAnalysis.recommendations.action === 'DECLINE' && (
                  <li className="flex items-start gap-2 text-red-800">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      {languageMode === 'TECHNICAL'
                        ? 'Transação bloqueada para revisão manual'
                        : 'Esta transação foi bloqueada por segurança'}
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Request ID: {analysis.requestId}</p>
            <p>Timestamp: {new Date(analysis.timestamp).toLocaleString('pt-BR')}</p>
            <p>Language Mode: {analysis.languageMode.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
