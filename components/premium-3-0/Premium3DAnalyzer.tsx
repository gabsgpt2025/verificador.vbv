'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, Globe, Zap, Shield, TrendingUp, Info, Database, Lock, Eye, EyeOff, Percent, Target } from 'lucide-react';
import { mapFullBinAnalysisToResponse } from '@/lib/premium-3-0/adapters';
import type { AnalysisResponse, FullBinAnalysis, LanguageMode } from '@/lib/premium-3-0/types';

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

type ApiErrorPayload = {
  ok?: boolean
  error?: string | { code?: string; message?: string; requestId?: string }
}

function extractApiErrorMessage(payload: ApiErrorPayload | null, status: number) {
  if (!payload) {
    return `Falha temporária na consulta do BIN (HTTP ${status}).`
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  if (payload.error?.message) {
    return payload.error.message
  }

  return `Falha temporária na consulta do BIN (HTTP ${status}).`
}

// Função auxiliar para converter likelihood em porcentagem
function likelihoodToPercentage(likelihood: string): number {
  const map: Record<string, number> = {
    VERY_LOW: 10,
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    VERY_HIGH: 90,
  };
  return map[likelihood] || 50;
}

// Função auxiliar para converter likelihood em texto
function likelihoodToText(likelihood: string): string {
  const map: Record<string, string> = {
    VERY_LOW: 'Muito Baixa',
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    VERY_HIGH: 'Muito Alta',
  };
  return map[likelihood] || 'Desconhecida';
}

export function Premium3DAnalyzer() {
  const [languageMode, setLanguageMode] = useState<'TECHNICAL' | 'POPULAR'>('TECHNICAL');
  const [cardNumber, setCardNumber] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const handleAnalyze = useCallback(async () => {
    const cleanBin = cardNumber.replace(/\D/g, '').slice(0, 8);

    if (!cleanBin || cleanBin.length < 6) {
      setError('Por favor, insira pelo menos os 6 primeiros dígitos do cartão');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/bin-analysis-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bin: cleanBin }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(extractApiErrorMessage(payload, res.status));
      }

      const apiData: FullBinAnalysis = await res.json();
      const response: AnalysisResponse = mapFullBinAnalysisToResponse(apiData);
      response.languageMode = LANGUAGE_MODES[languageMode];

      setAnalysis(response);
    } catch (err) {
      console.error('[Premium3DAnalyzer] API error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao analisar o cartão. Por favor, tente novamente.');
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

  // Calcular scores numéricos para 3DS
  const frictionlessPercentage = analysis ? likelihoodToPercentage(analysis.threeDSAnalysis.frictionlessLikelihood) : 0;
  const challengePercentage = analysis ? likelihoodToPercentage(analysis.threeDSAnalysis.challengeLikelihood) : 0;
  const bypassPercentage = analysis ? 100 - challengePercentage : 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="w-full max-w-7xl mx-auto px-4 space-y-8">
        {/* Header Premium */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              VeriFiBIN Premium 3.0
            </h1>
          </div>
          <p className="text-xl text-slate-300 font-semibold">
            Motor de Verificação de Segurança Anti-Fraude Completo
          </p>
          <p className="text-sm text-slate-400">
            Análise em tempo real com inteligência proprietária, detecção de frictionless, bypass e integração Mastercard
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
                Analisar Cartão (BIN)
              </span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              Insira os 6 primeiros dígitos do cartão para análise completa de segurança, frictionless, bypass e 3DS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Insira o BIN (6 a 8 dígitos, ex: 62796100)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-lg font-mono"
                />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 px-8"
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
            {/* Main Metrics - 3 Cards com Porcentagens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Frictionless */}
              <div className="bg-gradient-to-br from-emerald-950/50 to-teal-950/50 border border-emerald-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 font-mono text-sm font-bold">FRICTIONLESS</span>
                  </div>
                  <Badge className="bg-emerald-600/50 text-emerald-200 border-emerald-500/50">
                    {likelihoodToText(analysis.threeDSAnalysis.frictionlessLikelihood)}
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-emerald-200 mb-3">{frictionlessPercentage}%</div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${frictionlessPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-300/70">
                  {languageMode === 'TECHNICAL'
                    ? 'Probabilidade de fluxo sem desafio 3DS (Frictionless Flow)'
                    : 'Chance de transação sem verificação adicional'}
                </p>
              </div>

              {/* Desafio 3DS */}
              <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-300 font-mono text-sm font-bold">DESAFIO 3DS</span>
                  </div>
                  <Badge className="bg-amber-600/50 text-amber-200 border-amber-500/50">
                    {likelihoodToText(analysis.threeDSAnalysis.challengeLikelihood)}
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-amber-200 mb-3">{challengePercentage}%</div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${challengePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-amber-300/70">
                  {languageMode === 'TECHNICAL'
                    ? 'Probabilidade de desafio 3DS (Challenge Flow)'
                    : 'Chance de precisar fazer verificação adicional'}
                </p>
              </div>

              {/* Bypass */}
              <div className="bg-gradient-to-br from-rose-950/50 to-red-950/50 border border-rose-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-300 font-mono text-sm font-bold">CHANCE DE BYPASS</span>
                  </div>
                  <Badge className="bg-rose-600/50 text-rose-200 border-rose-500/50">
                    {bypassPercentage > 60 ? 'Alta' : bypassPercentage > 30 ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-rose-200 mb-3">{bypassPercentage}%</div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-red-500"
                    style={{ width: `${bypassPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-rose-300/70">
                  {languageMode === 'TECHNICAL'
                    ? 'Probabilidade de bypass de autenticação 3DS'
                    : 'Chance de evitar verificação de segurança'}
                </p>
              </div>
            </div>

            {/* Risk Score Card - Grande e Destacado */}
            <div className={`bg-gradient-to-br ${getRiskColor(analysis.riskAnalysis.riskLevel)} rounded-lg p-8 border-2 border-white/10 shadow-2xl`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  {getRiskIcon(analysis.riskAnalysis.riskLevel)}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Score de Risco Geral</h2>
                    <p className="text-white/80">
                      {languageMode === 'TECHNICAL'
                        ? 'Análise de risco agregada baseada em múltiplos fatores (BIN, temporal, comportamental, geográfico, dispositivo, gateway)'
                        : 'Nível geral de segurança da transação'}
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
                    Esconder Detalhes Completos
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar Detalhes Completos
                  </>
                )}
              </Button>
            </div>

            {showDetails && (
              <>
                {/* BIN Analysis - Completo */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Análise Completa de BIN
                      </span>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Informações detalhadas do banco emissor, tipo de cartão e características
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Grid de Informações Básicas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">BIN</p>
                        <p className="font-mono text-lg font-bold text-white">{analysis.binAnalysis.bin}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Emissor</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.issuerName}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">País</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.country}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Rede</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.issuingNetwork}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Tipo</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.productType}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Nível</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.cardLevel}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Recarregável</p>
                        <p className="font-semibold text-white">{analysis.binAnalysis.binData.isReloadable ? 'Sim' : 'Não'}</p>
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-mono uppercase">Score BIN</p>
                        <p className="font-mono text-lg font-bold text-white">{analysis.binAnalysis.riskScore}</p>
                      </div>
                    </div>

                    {/* Mecanismos de Bypass e Frictionless */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-950/50 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 font-mono mb-2 uppercase font-bold">Mecanismo de Bypass Detectado</p>
                        <p className="text-lg font-mono font-bold text-blue-200 mb-2">{analysis.binAnalysis.bypassMechanism}</p>
                        <p className="text-xs text-blue-300/70">
                          {languageMode === 'TECHNICAL'
                            ? 'Método de bypass 3DS identificado (Frictionless 3DS2, SCA Exemption, 3DS Nominal, etc.)'
                            : 'Forma como este cartão pode evitar verificação de segurança'}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-lg">
                        <p className="text-xs text-purple-300 font-mono mb-2 uppercase font-bold">Probabilidade de Frictionless</p>
                        <p className="text-lg font-mono font-bold text-purple-200 mb-2">{analysis.binAnalysis.frictionlessLikelihood}</p>
                        <p className="text-xs text-purple-300/70">
                          {languageMode === 'TECHNICAL'
                            ? 'Chance de fluxo sem desafio 3DS baseado nas características do BIN'
                            : 'Chance de transação sem verificação adicional'}
                        </p>
                      </div>
                    </div>

                    {/* Recomendações de BIN */}
                    {analysis.binAnalysis.recommendations.length > 0 && (
                      <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                        <p className="text-xs text-slate-400 font-mono mb-3 uppercase font-bold">Recomendações de BIN</p>
                        <ul className="space-y-2">
                          {analysis.binAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3DS Analysis - Completo */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Análise Completa 3DS/VBV
                      </span>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Análise detalhada de autenticação 3D Secure, frictionless e desafios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Fluxo Recomendado */}
                    <div className="p-4 bg-gradient-to-br from-blue-950/50 to-purple-950/50 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300 font-mono mb-2 uppercase font-bold">Fluxo 3DS Recomendado</p>
                      <p className="text-2xl font-bold text-blue-200 mb-3">{analysis.threeDSAnalysis.recommendedFlow}</p>
                      <p className="text-sm text-blue-300/80">
                        {analysis.threeDSAnalysis.explanation[languageMode.toLowerCase() as keyof typeof analysis.threeDSAnalysis.explanation]}
                      </p>
                    </div>

                    {/* Taxa de Sucesso */}
                    <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-teal-950/50 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-300 font-mono mb-2 uppercase font-bold">Taxa de Sucesso Estimada</p>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-emerald-200">{analysis.threeDSAnalysis.estimatedSuccessRate}%</div>
                        <div className="flex-1">
                          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{ width: `${analysis.threeDSAnalysis.estimatedSuccessRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-300/70 mt-3">
                        {languageMode === 'TECHNICAL'
                          ? 'Probabilidade estimada de aprovação da transação com este fluxo'
                          : 'Chance de sucesso da transação'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors Breakdown - Completo */}
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="w-5 h-5 text-cyan-400" />
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Análise Detalhada de Fatores de Risco
                      </span>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Breakdown completo de cada fator que contribui para o score de risco
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(analysis.riskAnalysis.riskFactors).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        binRisk: 'Risco de BIN',
                        temporalRisk: 'Risco Temporal',
                        behavioralRisk: 'Risco Comportamental',
                        geographicRisk: 'Risco Geográfico',
                        deviceRisk: 'Risco de Dispositivo',
                        gatewayRisk: 'Risco de Gateway',
                      };
                      return (
                        <div key={key} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-mono font-semibold text-slate-300">
                              {labels[key] || key}
                            </span>
                            <span className="text-sm font-bold text-white">{Math.round(value)}/100</span>
                          </div>
                          <div className="w-full h-3 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {value < 30 ? 'Baixo risco' : value < 60 ? 'Risco moderado' : 'Alto risco'}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Alerts */}
                {analysis.riskAnalysis.alerts.length > 0 && (
                  <Card className="border-rose-500/30 bg-rose-950/20 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-rose-300">
                        <AlertCircle className="w-5 h-5" />
                        Alertas de Fraude Detectados ({analysis.riskAnalysis.alerts.length})
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        Indicadores de risco e possíveis padrões de fraude
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.riskAnalysis.alerts.map((alert) => (
                          <div key={alert.id} className="p-4 bg-slate-700/50 border border-rose-500/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-white">{alert.title}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">{alert.category}</p>
                              </div>
                              <Badge className="bg-rose-600/50 text-rose-200 border-rose-500/50">{alert.severity}</Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-2">
                              {alert.description[languageMode.toLowerCase() as keyof typeof alert.description]}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Impacto no risco: +{alert.riskImpact}</span>
                              <span>{alert.detectionMethod}</span>
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
                      Recomendação Final
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Ação recomendada baseada em toda a análise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 bg-slate-700/50 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-300 font-mono mb-2 uppercase font-bold">Ação Recomendada</p>
                      <p className="text-2xl font-bold text-emerald-200 mb-3">{analysis.riskAnalysis.recommendations.action}</p>
                      <p className="text-sm text-slate-300 mb-3">
                        {analysis.riskAnalysis.recommendations.reasoning[languageMode.toLowerCase() as keyof typeof analysis.riskAnalysis.recommendations.reasoning]}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-600">
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
          <p>VeriFiBIN Premium 3.0 © 2026 | Motor de Inteligência Anti-Fraude Completo</p>
          <p className="mt-2">Análise em tempo real com dados proprietários, detecção de frictionless, bypass e integração Mastercard</p>
          <p className="mt-2 text-slate-600">Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Premium3DAnalyzer;
