'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, Globe, Zap, Shield, TrendingUp, Info, Database, Lock, Eye, EyeOff, Percent, Target, Gauge, BarChart3, TrendingDown } from 'lucide-react';
import HolisticEngine from '@/lib/premium-3-0/holisticEngine';
import type { HolisticAnalysisResult } from '@/lib/premium-3-0/holisticTypes';

const LANGUAGE_MODES = {
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

// Mock data para teste (será substituído por API real)
const mockCardData = {
  card_brand: 'VISA',
  card_type: 'CREDIT',
  card_category: 'GOLD',
  country_code: 'BR',
  country: 'Brazil',
  issuer: 'Nubank',
  is_commercial: false,
  is_prepaid: false,
  is_reloadable: false,
  customer_ip: '192.168.1.1',
  ip_country: 'BR',
  ip_matches_bin: true,
  ip_blocklisted: false,
};

export default function Premium3DAnalyzer() {
  const [languageMode, setLanguageMode] = useState<'TECHNICAL' | 'POPULAR'>('TECHNICAL');
  const [binInput, setBinInput] = useState('');
  const [analysis, setAnalysis] = useState<HolisticAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const handleAnalyze = useCallback(async () => {
    if (!binInput || binInput.length < 6) {
      setError('Por favor, insira pelo menos os 6 primeiros dígitos do cartão');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const engine = new HolisticEngine();
      const result = await engine.analyze(binInput.substring(0, 6), mockCardData);
      setAnalysis(result);
    } catch (err) {
      setError('Erro ao analisar o cartão. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [binInput]);

  const getRiskColor = (score: number) => {
    if (score < 20) return 'from-emerald-500 to-teal-600';
    if (score < 40) return 'from-lime-500 to-green-600';
    if (score < 60) return 'from-amber-500 to-orange-600';
    if (score < 80) return 'from-orange-500 to-red-600';
    return 'from-red-600 to-red-900';
  };

  const getRiskLevel = (score: number) => {
    if (score < 20) return 'MUITO BAIXO';
    if (score < 40) return 'BAIXO';
    if (score < 60) return 'MÉDIO';
    if (score < 80) return 'ALTO';
    return 'MUITO ALTO';
  };

  const getRiskIcon = (score: number) => {
    if (score < 40) return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
    if (score < 60) return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    return <AlertCircle className="w-6 h-6 text-red-600" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400';
    if (confidence >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

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
            Motor Holístico de Verificação Anti-Fraude
          </p>
          <p className="text-sm text-slate-400">
            Análise integrada com múltiplas fontes: APIs Mastercard, Neutrino, dados proprietários e históricos de mercado
          </p>
        </div>

        {/* Language Toggle */}
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/50 to-blue-950/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Modo de Linguagem
              </span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              {LANGUAGE_MODES[languageMode].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
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
              Insira os 6 primeiros dígitos do cartão para análise holística completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Insira o BIN (ex: 627961)"
                value={binInput}
                onChange={(e) => setBinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
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
            {/* 3 Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Frictionless */}
              <div className="bg-gradient-to-br from-emerald-950/50 to-teal-950/50 border border-emerald-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">Frictionless</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {analysis.probabilities.frictionless.level}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-emerald-400">
                    {analysis.probabilities.frictionless.percentage}%
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.frictionless.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    Confiança: <span className={getConfidenceColor(analysis.probabilities.frictionless.confidence)}>
                      {analysis.probabilities.frictionless.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 3DS Challenge */}
              <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/50 border border-amber-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">Desafio 3DS</span>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    {analysis.probabilities.threeDsActive.level}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-amber-400">
                    {analysis.probabilities.threeDsActive.percentage}%
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.threeDsActive.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    Confiança: <span className={getConfidenceColor(analysis.probabilities.threeDsActive.confidence)}>
                      {analysis.probabilities.threeDsActive.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bypass */}
              <div className="bg-gradient-to-br from-rose-950/50 to-red-950/50 border border-rose-500/30 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span className="text-sm font-semibold text-rose-300">Chance de Bypass</span>
                  </div>
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
                    {analysis.probabilities.bypass.level}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-rose-400">
                    {analysis.probabilities.bypass.percentage}%
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.bypass.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    Mecanismo: <span className="text-rose-300">{analysis.probabilities.bypass.mechanism}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Risk Score */}
            <Card className={`border-0 bg-gradient-to-r ${getRiskColor(analysis.riskScores.overall)} bg-opacity-10 backdrop-blur`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(analysis.riskScores.overall)}
                    <div>
                      <CardTitle className="text-2xl">Score de Risco Geral</CardTitle>
                      <CardDescription className="text-slate-300">
                        Análise consolidada de todos os fatores de risco
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-white">
                      {analysis.riskScores.overall}
                    </div>
                    <div className="text-sm font-semibold text-slate-300">
                      {getRiskLevel(analysis.riskScores.overall)}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Recomendação */}
            <Card className="border-blue-500/30 bg-gradient-to-r from-blue-950/50 to-slate-950/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Recomendação
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {analysis.recommendation.action}
                    </div>
                    <p className="text-slate-300 text-sm">
                      {languageMode === 'TECHNICAL'
                        ? analysis.explanations.technical.summary
                        : analysis.explanations.popular.summary}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-400">
                      {analysis.recommendation.confidence}%
                    </div>
                    <div className="text-xs text-slate-400">Confiança</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700 text-sm text-slate-300">
                  {analysis.recommendation.reason}
                </div>
              </CardContent>
            </Card>

            {/* Detalhes Expandíveis */}
            <Card className="border-slate-500/30 bg-gradient-to-r from-slate-900/50 to-slate-950/50 backdrop-blur">
              <CardHeader>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                    <span className="bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                      Análise Detalhada
                    </span>
                  </CardTitle>
                  <span className="text-slate-400">{showDetails ? '▼' : '▶'}</span>
                </button>
              </CardHeader>

              {showDetails && (
                <CardContent className="space-y-6">
                  {/* Dados do Cartão */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Informações do Cartão</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">BIN</div>
                        <div className="font-mono text-white">{analysis.bin}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">Marca</div>
                        <div className="text-white">{analysis.cardData.cardBrand}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">Tipo</div>
                        <div className="text-white">{analysis.cardData.cardType}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">Categoria</div>
                        <div className="text-white">{analysis.cardData.cardCategory}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">Emissor</div>
                        <div className="text-white">{analysis.cardData.issuer}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded">
                        <div className="text-xs text-slate-400">País</div>
                        <div className="text-white">{analysis.cardData.issuerCountryName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Scores de Risco Multidimensionais */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Scores de Risco por Dimensão</h3>
                    <div className="space-y-3">
                      {Object.entries(analysis.riskScores).map(([key, score]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm font-semibold text-white">{score}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explicações */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {languageMode === 'TECHNICAL' ? 'Análise Técnica' : 'Explicação Simplificada'}
                    </h3>
                    <div className="space-y-3">
                      {(languageMode === 'TECHNICAL'
                        ? analysis.explanations.technical.details
                        : analysis.explanations.popular.details
                      ).map((detail, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded text-sm text-slate-300 flex gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fatores de Risco */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Fatores de Risco Identificados</h3>
                    <div className="space-y-2">
                      {analysis.explanations.technical.factors.map((factor, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">{factor.name}</span>
                            <span className={`text-sm font-bold ${factor.impact > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadados */}
                  <div className="p-4 bg-slate-800/30 rounded border border-slate-700">
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Versão: {analysis.metadata.version}</div>
                      <div>Tempo de cálculo: {analysis.metadata.calculationTime}ms</div>
                      <div>Qualidade dos dados: {analysis.metadata.dataQuality}%</div>
                      <div>Fontes: {analysis.metadata.sourcesUsed.join(', ')}</div>
                      <div>Timestamp: {new Date(analysis.timestamp).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
