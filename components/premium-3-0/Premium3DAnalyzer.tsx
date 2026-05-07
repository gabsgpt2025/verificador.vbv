'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, Globe, Zap, Shield, TrendingUp, Info, Database, Lock, Eye, EyeOff } from 'lucide-react';
import { calculateRisk } from '@/lib/premium-3-0/riskEngine';
import { analyzeBIN } from '@/lib/premium-3-0/binIntelligence';
import { analyze3DS, getTimeOfDay, getDayOfWeek } from '@/lib/premium-3-0/threeDSEngine';
import type { AnalysisRequest, AnalysisResponse, LanguageMode } from '@/lib/premium-3-0/types';

const LANGUAGE_MODES: Record<string, LanguageMode> = {
  TECHNICAL: {
    mode: 'TECHNICAL',
    label: '🔧 Modo Técnico',
    description: 'Linguagem especializada para profissionais de segurança',
  },
  POPULAR: {
    mode: 'POPULAR',
    label: '👥 Modo Popular',
    description: 'Linguagem simples e acessível para todos',
  },
};

export default function Premium3DAnalyzer() {
  const [languageMode, setLanguageMode] = useState<'TECHNICAL' | 'POPULAR'>('TECHNICAL');
  const [cardNumber, setCardNumber] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

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
      LOW: 'from-emerald-500 to-teal-600',
      MEDIUM: 'from-amber-500 to-orange-600',
      HIGH: 'from-rose-500 to-red-600',
      CRITICAL: 'from-red-600 to-red-900',
    };
    return colors[level] || 'from-slate-500 to-slate-600';
  };

  const getRiskBgColor = (level: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-emerald-50 border-emerald-200',
      MEDIUM: 'bg-amber-50 border-amber-200',
      HIGH: 'bg-rose-50 border-rose-200',
      CRITICAL: 'bg-red-900 border-red-950',
    };
    return colors[level] || 'bg-slate-50';
  };

  const getRiskTextColor = (level: string) => {
    const colors: Record<string, string> = {
      LOW: 'text-emerald-900',
      MEDIUM: 'text-amber-900',
      HIGH: 'text-rose-900',
      CRITICAL: 'text-red-50',
    };
    return colors[level] || 'text-slate-900';
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'HIGH':
        return <AlertCircle className="w-6 h-6 text-rose-600" />;
      case 'CRITICAL':
        return <XCircle className="w-6 h-6 text-red-50" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="w-full max-w-7xl mx-auto px-4 space-y-8">
        {/* Header Premium */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              VeriFiBIN Premium 3.0
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Motor de Verificação de Segurança Anti-Fraude com Análise de BIN, 3DS e Detecção de Frictionless
          </p>
          <p className="text-sm text-slate-400">
            Análise em tempo real com inteligência proprietária e integração Mastercard
          </p>
        </div>

        {/* Language Toggle Card */}
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/50 to-blue-950/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Modo de Linguagem
              </span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              Escolha entre linguagem técnica especializada ou popular e acessível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              {Object.entries(LANGUAGE_MODES).map(([key, mode]) => (
                <Button
                  key={key}
                  variant={languageMode === key ? 'default' : 'outline'}
                  onClick={() => setLanguageMode(key as any)}
                  className={`flex-1 transition-all ${
                    languageMode === key
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-0'
                      : 'border-slate-600 hover:border-purple-400'
                  }`}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-slate-300">
              {LANGUAGE_MODES[languageMode].description}
            </p>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/50 to-slate-950/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Analisar Cartão
              </span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              Insira os 6 primeiros dígitos do cartão (BIN) para análise completa de segurança
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
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0"
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-6">
            {/* Risk Score Card - Grande e Destacado */}
            <div className={`bg-gradient-to-br ${getRiskColor(analysis.riskAnalysis.riskLevel)} rounded-lg p-8 border-2 border-white/10 shadow-2xl`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  {getRiskIcon(analysis.riskAnalysis.riskLevel)}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Score de Risco</h2>
                    <p className="text-white/80">
                      {languageMode === 'TECHNICAL'
                        ? 'Análise de risco geral da transação baseada em múltiplos fatores'
                        : 'Nível de segurança da transação'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold text-white mb-2">{analysis.riskAnalysis.overallRiskScore}</div>
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-1">
                    {analysis.riskAnalysis.riskLevel}
                  </Badge>
                </div>
              </div>
              <div className="bg-white/10 rounded p-4 backdrop-blur">
                <p className="text-white text-lg">
                  {analysis.riskAnalysis.recommendations.reasoning[languageMode.toLowerCase() as keyof typeof analysis.riskAnalysis.recommendations.reasoning]}
                </p>
              </div>
            </div>

            {/* Toggle para mostrar/esconder detalhes */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="border-slate-600 hover:border-purple-400 text-slate-300"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Esconder Detalhes
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar Detalhes
                  </>
                )}
              </Button>
            </div>

            {showDetails && (
              <>
                {/* BIN Analysis */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Análise de BIN
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono">EMISSOR</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.issuerName}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono">PAÍS</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.country}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono">TIPO</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.productType}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono">NÍVEL</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.cardLevel}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-950/50 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 font-mono mb-2">MECANISMO DE BYPASS</p>
                        <p className="text-lg font-mono font-bold text-blue-200">{analysis.binAnalysis.bypassMechanism}</p>
                        <p className="text-xs text-blue-300/70 mt-2">
                          {languageMode === 'TECHNICAL'
                            ? 'Método de bypass 3DS detectado'
                            : 'Forma como este cartão pode evitar verificação'}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-lg">
                        <p className="text-xs text-purple-300 font-mono mb-2">PROBABILIDADE DE FRICTIONLESS</p>
                        <p className="text-lg font-mono font-bold text-purple-200">{analysis.binAnalysis.frictionlessLikelihood}</p>
                        <p className="text-xs text-purple-300/70 mt-2">
                          {languageMode === 'TECHNICAL'
                            ? 'Chance de fluxo sem desafio 3DS'
                            : 'Chance de transação sem verificação'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3DS Analysis */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Análise 3DS
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-teal-950/50 border border-emerald-500/30 rounded-lg">
                        <p className="text-xs text-emerald-300 font-mono mb-2">PROBABILIDADE DE FRICTIONLESS</p>
                        <p className="text-2xl font-bold text-emerald-200 mb-2">{analysis.threeDSAnalysis.frictionlessLikelihood}</p>
                        <p className="text-xs text-emerald-300/70">
                          {languageMode === 'TECHNICAL'
                            ? 'Fluxo sem desafio 3DS'
                            : 'Transação sem verificação'}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-lg">
                        <p className="text-xs text-amber-300 font-mono mb-2">PROBABILIDADE DE DESAFIO</p>
                        <p className="text-2xl font-bold text-amber-200 mb-2">{analysis.threeDSAnalysis.challengeLikelihood}</p>
                        <p className="text-xs text-amber-300/70">
                          {languageMode === 'TECHNICAL'
                            ? 'Fluxo com desafio 3DS'
                            : 'Transação com verificação'}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 font-mono mb-2">TAXA DE SUCESSO ESTIMADA</p>
                        <p className="text-2xl font-bold text-blue-200 mb-2">{analysis.threeDSAnalysis.estimatedSuccessRate}%</p>
                        <p className="text-xs text-blue-300/70">
                          {languageMode === 'TECHNICAL'
                            ? 'Probabilidade de aprovação'
                            : 'Chance de sucesso'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                      <p className="text-xs text-slate-400 font-mono mb-2">FLUXO RECOMENDADO</p>
                      <p className="text-lg font-mono font-bold text-white mb-3">{analysis.threeDSAnalysis.recommendedFlow}</p>
                      <p className="text-sm text-slate-300">
                        {analysis.threeDSAnalysis.explanation[languageMode.toLowerCase() as keyof typeof analysis.threeDSAnalysis.explanation]}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors Breakdown */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="w-5 h-5 text-cyan-400" />
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Análise de Fatores de Risco
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analysis.riskAnalysis.riskFactors).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <span className="text-sm font-mono text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-red-500"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">{Math.round(value)}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Alerts */}
                {analysis.riskAnalysis.alerts.length > 0 && (
                  <Card className="border-rose-500/30 bg-rose-950/20 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-rose-300">
                        <AlertCircle className="w-5 h-5" />
                        Alertas Detectados ({analysis.riskAnalysis.alerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.riskAnalysis.alerts.map((alert) => (
                          <div key={alert.id} className="p-4 bg-slate-700/50 border border-rose-500/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-white">{alert.title}</p>
                              <Badge className="bg-rose-600/50 text-rose-200 border-rose-500/50">{alert.severity}</Badge>
                            </div>
                            <p className="text-sm text-slate-300">
                              {alert.description[languageMode.toLowerCase() as keyof typeof alert.description]}
                            </p>
                            <div className="mt-2 text-xs text-slate-400 font-mono">
                              Impacto no risco: +{alert.riskImpact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                <Card className="border-emerald-500/30 bg-emerald-950/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-emerald-300">
                      <CheckCircle2 className="w-5 h-5" />
                      Recomendações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 bg-slate-700/50 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-300 font-mono mb-2">AÇÃO RECOMENDADA</p>
                      <p className="text-lg font-bold text-emerald-200 mb-3">{analysis.riskAnalysis.recommendations.action}</p>
                      <p className="text-sm text-slate-300 mb-3">
                        {analysis.riskAnalysis.recommendations.reasoning[languageMode.toLowerCase() as keyof typeof analysis.riskAnalysis.recommendations.reasoning]}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Confiança: {analysis.riskAnalysis.recommendations.confidence}%</span>
                        <span>Request ID: {analysis.requestId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-8 border-t border-slate-700">
          <p>VeriFiBIN Premium 3.0 © 2026 | Motor de Inteligência Anti-Fraude</p>
          <p className="mt-2">Análise em tempo real com dados proprietários e integração Mastercard</p>
        </div>
      </div>
    </div>
  );
}
