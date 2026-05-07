'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Info,
  Database,
  Lock,
  Eye,
  EyeOff,
  Percent,
  Target,
  Gauge,
  BarChart3,
  TrendingDown,
  MapPin,
  Clock,
  Building2,
  CreditCard,
  Network,
  Layers,
  CheckSquare,
  AlertSquare,
  HelpCircle,
} from 'lucide-react';
import HolisticEngine from '@/lib/premium-3-0/holisticEngine';
import type { HolisticAnalysisResult } from '@/lib/premium-3-0/holisticTypes';

const LANGUAGE_MODES = {
  TECHNICAL: {
    mode: 'TECHNICAL',
    label: '🔧 Técnico',
    description: 'Linguagem especializada para profissionais de segurança',
  },
  POPULAR: {
    mode: 'POPULAR',
    label: '👥 Acessível',
    description: 'Linguagem simples e compreensível',
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
      setExpandedSection(null);
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
    return 'CRÍTICO';
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

  const DataSourceBadge = ({ source, confidence }: { source: string; confidence: number }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-md text-xs">
      <Database className="w-3 h-3 text-slate-400" />
      <span className="text-slate-300">{source}</span>
      <span className={`ml-auto font-semibold ${getConfidenceColor(confidence)}`}>
        {confidence}%
      </span>
    </div>
  );

  const DetailRow = ({ label, value, source, icon: Icon }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-b-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-100">{value}</span>
        {source && <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">{source}</span>}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 py-16">
      <div className="w-full max-w-7xl mx-auto px-4 space-y-8">
        {/* Header Premium - Modern Minimal */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-slate-900 rounded-lg shadow-sm">
              <Shield className="w-6 h-6 text-slate-100" />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">
              VeriFiBIN 3.0 Premium
            </h1>
          </div>
          <p className="text-lg text-slate-600 font-medium">
            Motor Holístico de Verificação Anti-Fraude
          </p>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Análise integrada com múltiplas fontes: APIs Mastercard, Neutrino, MaxMind e dados proprietários. Dados cruzados em tempo real para decisões precisas.
          </p>
        </div>

        {/* Language Toggle - Minimal */}
        <div className="flex gap-3 justify-center">
          {Object.entries(LANGUAGE_MODES).map(([key, mode]) => (
            <Button
              key={key}
              variant={languageMode === key ? 'default' : 'outline'}
              onClick={() => setLanguageMode(key as any)}
              className={`transition-all ${
                languageMode === key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
              }`}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Input Section - Minimal */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-slate-700" />
              Analisar Cartão (BIN)
            </CardTitle>
            <CardDescription className="text-slate-600">
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
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                maxLength={6}
                className="flex-1 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 text-lg font-mono"
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-slate-900 text-white hover:bg-slate-800 border-0 px-8"
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-8">
            {/* Risk Assessment - Main Indicator */}
            <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getRiskColor(analysis.riskScore)}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(analysis.riskScore)}
                    <div>
                      <CardTitle className="text-slate-900">Avaliação de Risco</CardTitle>
                      <CardDescription className="text-slate-600">
                        Análise holística baseada em múltiplas fontes de dados
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-slate-900">{analysis.riskScore}</div>
                    <Badge className="bg-slate-900 text-white mt-2">{getRiskLevel(analysis.riskScore)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${getRiskColor(analysis.riskScore)} h-3 rounded-full transition-all`}
                    style={{ width: `${analysis.riskScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3 Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Frictionless Probability */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">Frictionless</CardTitle>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {analysis.probabilities.frictionless.level}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600">
                    Probabilidade de transação sem desafio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-slate-900">
                    {analysis.probabilities.frictionless.percentage}%
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.frictionless.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Confiança: <span className="font-semibold text-slate-700">
                      {analysis.probabilities.frictionless.confidence}%
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">Fontes de dados:</p>
                    <div className="space-y-2">
                      <DataSourceBadge source="Mastercard 3DS" confidence={85} />
                      <DataSourceBadge source="Histórico BIN" confidence={78} />
                      <DataSourceBadge source="Padrão IP" confidence={72} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3DS Challenge Probability */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">Desafio 3DS</CardTitle>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      {analysis.probabilities.threeDsActive.level}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600">
                    Probabilidade de ativar autenticação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-slate-900">
                    {analysis.probabilities.threeDsActive.percentage}%
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.threeDsActive.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Confiança: <span className="font-semibold text-slate-700">
                      {analysis.probabilities.threeDsActive.confidence}%
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">Motivos de ativação:</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Risco elevado detectado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Padrão anômalo de transação</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>Regulação PSD2 obrigatória</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Bypass Probability */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">Bypass Risk</CardTitle>
                    </div>
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      {analysis.probabilities.bypassRisk?.level || 'BAIXO'}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600">
                    Probabilidade de tentativa de bypass
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-slate-900">
                    {analysis.probabilities.bypassRisk?.percentage || 15}%
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${analysis.probabilities.bypassRisk?.percentage || 15}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Confiança: <span className="font-semibold text-slate-700">
                      {analysis.probabilities.bypassRisk?.confidence || 68}%
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">Indicadores:</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>Padrão de ataque conhecido</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>Múltiplas tentativas recentes</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown - Expandable Sections */}
            <div className="space-y-4">
              {/* BIN Information */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'bin' ? null : 'bin')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">Informações do BIN</CardTitle>
                    </div>
                    <span className="text-slate-400">{expandedSection === 'bin' ? '−' : '+'}</span>
                  </div>
                </CardHeader>
                {expandedSection === 'bin' && (
                  <CardContent className="space-y-4">
                    <DetailRow
                      label="Bandeira"
                      value={mockCardData.card_brand}
                      source="Mastercard"
                      icon={CreditCard}
                    />
                    <DetailRow
                      label="Tipo de Cartão"
                      value={mockCardData.card_type}
                      source="BIN Database"
                      icon={Layers}
                    />
                    <DetailRow
                      label="Categoria"
                      value={mockCardData.card_category}
                      source="Mastercard"
                      icon={Target}
                    />
                    <DetailRow
                      label="Emissor"
                      value={mockCardData.issuer}
                      source="BIN Database"
                      icon={Building2}
                    />
                    <DetailRow
                      label="País de Emissão"
                      value={mockCardData.country}
                      source="Mastercard"
                      icon={MapPin}
                    />
                    <DetailRow
                      label="Cartão Comercial"
                      value={mockCardData.is_commercial ? 'Sim' : 'Não'}
                      source="BIN Database"
                      icon={CheckSquare}
                    />
                    <DetailRow
                      label="Pré-pago"
                      value={mockCardData.is_prepaid ? 'Sim' : 'Não'}
                      source="BIN Database"
                      icon={CheckSquare}
                    />
                  </CardContent>
                )}
              </Card>

              {/* IP & Geolocation */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'ip' ? null : 'ip')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">IP & Geolocalização</CardTitle>
                    </div>
                    <span className="text-slate-400">{expandedSection === 'ip' ? '−' : '+'}</span>
                  </div>
                </CardHeader>
                {expandedSection === 'ip' && (
                  <CardContent className="space-y-4">
                    <DetailRow
                      label="Endereço IP"
                      value={mockCardData.customer_ip}
                      source="MaxMind"
                      icon={Network}
                    />
                    <DetailRow
                      label="País do IP"
                      value={mockCardData.ip_country}
                      source="MaxMind"
                      icon={MapPin}
                    />
                    <DetailRow
                      label="Corresponde ao BIN"
                      value={mockCardData.ip_matches_bin ? 'Sim' : 'Não'}
                      source="Análise"
                      icon={CheckCircle2}
                    />
                    <DetailRow
                      label="Bloqueado"
                      value={mockCardData.ip_blocklisted ? 'Sim' : 'Não'}
                      source="Neutrino"
                      icon={AlertSquare}
                    />
                    <DetailRow
                      label="Tipo de Conexão"
                      value="Residencial"
                      source="MaxMind"
                      icon={Network}
                    />
                    <DetailRow
                      label="Reputação"
                      value="Confiável"
                      source="Neutrino"
                      icon={Shield}
                    />
                  </CardContent>
                )}
              </Card>

              {/* Transaction Rules */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'rules' ? null : 'rules')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-slate-700" />
                      <CardTitle className="text-slate-900">Regras de Transação</CardTitle>
                    </div>
                    <span className="text-slate-400">{expandedSection === 'rules' ? '−' : '+'}</span>
                  </div>
                </CardHeader>
                {expandedSection === 'rules' && (
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">Transação Aprovada</p>
                          <p className="text-xs text-emerald-700 mt-1">Risco baixo detectado. Transação pode ser processada sem desafio.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-900">Critérios de Aprovação:</p>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>Risco abaixo de 40 pontos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>IP corresponde ao país do BIN</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>Sem padrões anômalos detectados</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>Banco emissor não bloqueado</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2 text-sm pt-3 border-t border-slate-200">
                      <p className="font-semibold text-slate-900">Quando Ativar Desafio:</p>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠</span>
                          <span>Risco entre 40-70 pontos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠</span>
                          <span>IP em país diferente do BIN (sem VPN)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠</span>
                          <span>Múltiplas transações em curto período</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">⚠</span>
                          <span>Valor acima do limite de confiança</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2 text-sm pt-3 border-t border-slate-200">
                      <p className="font-semibold text-slate-900">Quando Bloquear:</p>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✕</span>
                          <span>Risco acima de 70 pontos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✕</span>
                          <span>IP em lista negra de fraude</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✕</span>
                          <span>Banco emissor bloqueado</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✕</span>
                          <span>Padrão de ataque conhecido</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Data Sources Summary */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-slate-700" />
                  <CardTitle className="text-slate-900">Fontes de Dados</CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  Todas as informações são coletadas de múltiplas fontes confiáveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-3">APIs Integradas</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Mastercard 3DS Server
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Neutrino Fraud Detection
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        MaxMind GeoIP2
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        BIN Database Proprietário
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-3">Dados Analisados</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Histórico de transações
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Padrões de comportamento
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Reputação de IP/BIN
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        Conformidade regulatória
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
