// VeriFiBIN 2.0 — Advanced Fraud Alert Engine
// Generates contextual fraud alerts based on BIN, issuer, country, and transaction context.
// All alerts are probabilistic and educational — for anti-fraud system integration only.

import type { TechnicalData, ThreeDSAnalysis, RiskAnalysis } from "./types"
import type { IssuerProfile } from "./issuerIntelligence"

export type AlertSeverity = "INFO" | "AVISO" | "ALTO" | "CRITICO"
export type AlertCategory =
  | "3DS_BEHAVIOR"
  | "ISSUER_SPECIFIC"
  | "GATEWAY_RISK"
  | "CARD_TYPE"
  | "BEHAVIORAL"
  | "TEMPORAL"
  | "COMPLIANCE"
  | "BYPASS_RISK"

export interface FraudAlert {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  description: string
  recommendation: string
  riskImpact: number // points to add to risk score
}

// ─── Alert Definitions ──────────────────────────────────────────────────────

export const FRAUD_ALERT_DEFINITIONS: Record<string, FraudAlert> = {

  // ── 3DS BEHAVIOR ALERTS ──────────────────────────────────────────────────
  FRICTIONLESS_MUITO_ALTO: {
    id: "FRICTIONLESS_MUITO_ALTO",
    severity: "ALTO",
    category: "3DS_BEHAVIOR",
    title: "Alta probabilidade de fluxo 3DS frictionless",
    description: "Este emissor tem histórico de aprovar transações via 3DS frictionless flow (sem desafio visual ao portador). O 3DS está tecnicamente presente, mas o ACS do emissor aprova silenciosamente com base em risk scoring interno.",
    recommendation: "Exigir dados adicionais de autenticação ou aplicar verificação de identidade extra antes de processar.",
    riskImpact: 25,
  },
  FRICTIONLESS_POSSIVEL_VALOR_BAIXO: {
    id: "FRICTIONLESS_POSSIVEL_VALOR_BAIXO",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "Frictionless possível em transações de baixo valor",
    description: "Emissor aplica isenção de baixo valor (SCA Low-Value Exemption) para transações abaixo de R$100-150. Transações nessa faixa podem ser aprovadas sem desafio 3DS.",
    recommendation: "Para transações abaixo de R$100, considerar exigir autenticação adicional no nível do gateway.",
    riskImpact: 15,
  },
  FRICTIONLESS_POSSIVEL_HORARIO_ESPECIFICO: {
    id: "FRICTIONLESS_POSSIVEL_HORARIO_ESPECIFICO",
    severity: "AVISO",
    category: "TEMPORAL",
    title: "Janela temporal de menor rigor 3DS detectada",
    description: "Este emissor apresenta comportamento de autenticação mais permissivo em horários específicos (madrugada, fins de semana, feriados) quando equipes de monitoramento estão reduzidas.",
    recommendation: "Aplicar regra de risco temporal: transações fora do horário comercial com este BIN devem receber score adicional.",
    riskImpact: 20,
  },
  NOVO_CARTAO_SEM_3DS_INICIAL: {
    id: "NOVO_CARTAO_SEM_3DS_INICIAL",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Cartão novo pode estar sem 3DS ativo",
    description: "Este emissor ativa o 3DS somente após a 1ª compra realizada com o cartão. Cartões recém-emitidos (< 24h) podem não ter o 3DS completamente ativo.",
    recommendation: "Verificar histórico de transações do cartão. Se for a 1ª transação, aplicar verificação manual.",
    riskImpact: 20,
  },
  NOVO_CARTAO_3DS_DELAY_48H: {
    id: "NOVO_CARTAO_3DS_DELAY_48H",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Cartão emitido recentemente — 3DS pode estar em ativação (48h)",
    description: "Este emissor leva até 48 horas para ativar o 3DS após a emissão do cartão. Transações nas primeiras 48h podem não acionar autenticação.",
    recommendation: "Para cartões com histórico de emissão recente, aplicar verificação de identidade adicional.",
    riskImpact: 20,
  },
  NOVO_CARTAO_3DS_DELAY_72H: {
    id: "NOVO_CARTAO_3DS_DELAY_72H",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Cartão emitido recentemente — 3DS pode estar em ativação (72h)",
    description: "Este emissor leva até 3 dias para ativar o VBV após ativação do cartão.",
    recommendation: "Verificar data de emissão do cartão. Aplicar verificação adicional para cartões com menos de 72h.",
    riskImpact: 20,
  },
  NOVO_CARTAO_3DS_FRACO: {
    id: "NOVO_CARTAO_3DS_FRACO",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "3DS fraco nos primeiros dias após emissão",
    description: "Este emissor white-label apresenta implementação de 3DS mais fraca nos primeiros dias após emissão do cartão.",
    recommendation: "Aplicar verificação adicional para cartões com menos de 5 dias de emissão.",
    riskImpact: 15,
  },
  CARTAO_DEPENDENTE_SEM_3DS: {
    id: "CARTAO_DEPENDENTE_SEM_3DS",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Possível cartão adicional/dependente sem 3DS",
    description: "Cartões adicionais (dependentes) deste emissor são emitidos sem 3DS inicial. O 3DS do titular principal não cobre automaticamente os cartões adicionais.",
    recommendation: "Verificar se o cartão é principal ou adicional. Aplicar verificação de identidade extra para cartões adicionais.",
    riskImpact: 15,
  },
  CVV_DINAMICO: {
    id: "CVV_DINAMICO",
    severity: "INFO",
    category: "CARD_TYPE",
    title: "Cartão com CVV dinâmico detectado",
    description: "Este cartão utiliza CVV dinâmico que muda a cada transação ou expira após 1 uso. Gateways legados que armazenam ou reutilizam CVV podem ter problemas de compatibilidade.",
    recommendation: "Verificar compatibilidade do gateway com autenticação por token real-time. Não armazenar CVV.",
    riskImpact: 0,
  },
  "3DS_NOMINAL": {
    id: "3DS_NOMINAL",
    severity: "CRITICO",
    category: "3DS_BEHAVIOR",
    title: "3DS nominal detectado — sem ACS real implementado",
    description: "Este emissor aparece como 'enrolled' no diretório 3DS (enrolled=Y), mas não possui um Access Control Server (ACS) funcional. Transações passam sem autenticação real.",
    recommendation: "Tratar como cartão sem 3DS. Exigir autenticação alternativa ou bloquear preventivamente.",
    riskImpact: 40,
  },
  SEM_3DS: {
    id: "SEM_3DS",
    severity: "CRITICO",
    category: "3DS_BEHAVIOR",
    title: "Emissor sem implementação de 3DS",
    description: "Este emissor não implementa 3D Secure. Transações online são processadas sem autenticação adicional do portador.",
    recommendation: "Aplicar verificação de identidade alternativa obrigatória. Alto risco de chargeback.",
    riskImpact: 35,
  },
  "3DS_OBRIGATORIO": {
    id: "3DS_OBRIGATORIO",
    severity: "INFO",
    category: "3DS_BEHAVIOR",
    title: "3DS obrigatório — emissor com alta conformidade",
    description: "Este emissor exige 3DS em todas as transações online, incluindo valores baixos. Declínio automático se o 3DS não for completado.",
    recommendation: "Garantir que o gateway suporte 3DS completo com fallback adequado.",
    riskImpact: -10,
  },
  SILENT_DECLINE_RISK: {
    id: "SILENT_DECLINE_RISK",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Risco de declínio silencioso (silent decline)",
    description: "Este emissor pode retornar uma resposta de 'aguardando processamento' sem processar efetivamente a transação, ou apresentar um delay artificial antes de rejeitar. Isso pode enganar sistemas que usam timeout como aprovação.",
    recommendation: "Implementar verificação de status assíncrona. Não considerar timeout como aprovação.",
    riskImpact: 15,
  },

  // ── BYPASS RISK ALERTS ───────────────────────────────────────────────────
  ISENCAO_B2B_PROVAVEL: {
    id: "ISENCAO_B2B_PROVAVEL",
    severity: "ALTO",
    category: "BYPASS_RISK",
    title: "Isenção B2B/Corporativa provável — bypass de 3DS esperado",
    description: "Cartão corporativo com alta probabilidade de isenção SCA para pagamentos B2B (PSD2 Secure Corporate Payment Exemption). Mesmo com 3DS registrado, gateways frequentemente suprimem a autenticação.",
    recommendation: "Para transações com cartões corporativos, verificar CNPJ/empresa e aplicar verificação alternativa de identidade.",
    riskImpact: 30,
  },
  BYPASS_CORPORATIVO: {
    id: "BYPASS_CORPORATIVO",
    severity: "ALTO",
    category: "BYPASS_RISK",
    title: "Perfil de bypass corporativo detectado",
    description: "Este BIN corporativo tem histórico de aprovação sem desafio 3DS em gateways que confiam na natureza PJ do cartão.",
    recommendation: "Exigir verificação de CNPJ e dados da empresa. Não confiar apenas no 3DS para cartões PJ.",
    riskImpact: 25,
  },
  BYPASS_CORPORATIVO_TOTAL: {
    id: "BYPASS_CORPORATIVO_TOTAL",
    severity: "CRITICO",
    category: "BYPASS_RISK",
    title: "Bypass corporativo total — autenticação completamente suprimida",
    description: "Este cartão corporativo tem autenticação 3DS completamente suprimida por isenção B2B. Transações aprovam sem qualquer desafio.",
    recommendation: "Tratar como cartão sem 3DS. Exigir verificação de identidade corporativa completa.",
    riskImpact: 40,
  },
  ISENCAO_BAIXO_VALOR: {
    id: "ISENCAO_BAIXO_VALOR",
    severity: "AVISO",
    category: "BYPASS_RISK",
    title: "Isenção de baixo valor aplicável",
    description: "Para transações abaixo do limiar de isenção (R$150 / €30), este emissor aplica a isenção SCA de baixo valor, aprovando sem desafio 3DS.",
    recommendation: "Implementar regra: transações abaixo de R$150 com este BIN recebem score de risco adicional.",
    riskImpact: 15,
  },

  // ── GATEWAY RISK ALERTS ──────────────────────────────────────────────────
  GATEWAY_FALLBACK_POSSIVEL: {
    id: "GATEWAY_FALLBACK_POSSIVEL",
    severity: "ALTO",
    category: "GATEWAY_RISK",
    title: "Risco de fallback de gateway — 3DS pode ser suprimido",
    description: "Este emissor/cartão é frequentemente usado em gateways que não implementam fallback completo de 3DS. A transação pode ser aprovada sem autenticação se o gateway não solicitar o iframe 3DS.",
    recommendation: "Verificar se o gateway utilizado implementa 3DS completo com fallback. Auditar logs de autenticação.",
    riskImpact: 25,
  },
  SANDBOX_SEM_3DS: {
    id: "SANDBOX_SEM_3DS",
    severity: "AVISO",
    category: "GATEWAY_RISK",
    title: "Ambiente sandbox sem 3DS",
    description: "O ambiente de teste/sandbox deste gateway nunca exibe 3DS. Comportamento de produção pode ser diferente.",
    recommendation: "Testar fluxo 3DS em ambiente de produção com cartões de teste específicos.",
    riskImpact: 0,
  },
  MULTIPLAS_TENTATIVAS: {
    id: "MULTIPLAS_TENTATIVAS",
    severity: "ALTO",
    category: "BEHAVIORAL",
    title: "Cartão com tolerância a múltiplas tentativas",
    description: "Este emissor permite múltiplas tentativas de pagamento (até 3-5) antes de bloquear o cartão. Isso é sinal de antifraude fraco e pode ser explorado em ataques de força bruta.",
    recommendation: "Se detectar tentativas em sequência com o mesmo BIN e device, bloquear preventivamente e alertar.",
    riskImpact: 20,
  },
  MULTIPLAS_TENTATIVAS_CVC_DIFERENTE: {
    id: "MULTIPLAS_TENTATIVAS_CVC_DIFERENTE",
    severity: "CRITICO",
    category: "BEHAVIORAL",
    title: "Emissor permite múltiplas tentativas com CVV diferente",
    description: "Este emissor permite até 5 tentativas com CVV diferente antes de bloquear. Isso facilita ataques de brute force de CVV.",
    recommendation: "Bloquear imediatamente se detectar mais de 2 tentativas com CVV diferente para o mesmo cartão.",
    riskImpact: 40,
  },
  MULTIPLAS_TENTATIVAS_SEM_BLOQUEIO: {
    id: "MULTIPLAS_TENTATIVAS_SEM_BLOQUEIO",
    severity: "ALTO",
    category: "BEHAVIORAL",
    title: "Emissor não bloqueia em múltiplas tentativas — apenas notifica",
    description: "Este emissor não bloqueia o cartão em múltiplas tentativas, apenas envia notificação ao portador. Isso permite ataques de enumeração.",
    recommendation: "Implementar rate limiting por BIN no nível do gateway. Bloquear após 3 tentativas falhas.",
    riskImpact: 30,
  },
  BRUTE_FORCE_RISK: {
    id: "BRUTE_FORCE_RISK",
    severity: "CRITICO",
    category: "BEHAVIORAL",
    title: "Risco de ataque de força bruta detectado",
    description: "Combinação de sem 3DS + múltiplas tentativas permitidas cria condição ideal para ataques de brute force de CVV ou dados de cartão.",
    recommendation: "Implementar CAPTCHA, rate limiting agressivo e bloqueio por IP/device após 2 tentativas falhas.",
    riskImpact: 45,
  },

  // ── CARD TYPE ALERTS ─────────────────────────────────────────────────────
  WHITE_LABEL_COMPORTAMENTO_DIFERENTE: {
    id: "WHITE_LABEL_COMPORTAMENTO_DIFERENTE",
    severity: "AVISO",
    category: "CARD_TYPE",
    title: "Cartão white-label — comportamento 3DS diferente do banco pai",
    description: "Este cartão é emitido por uma instituição white-label. O comportamento de 3DS pode ser significativamente diferente do banco emissor principal, geralmente mais permissivo.",
    recommendation: "Não assumir o comportamento do banco pai. Tratar como emissor independente com risco adicional.",
    riskImpact: 15,
  },
  CARTAO_SOCIAL_RESTRICAO_ONLINE: {
    id: "CARTAO_SOCIAL_RESTRICAO_ONLINE",
    severity: "INFO",
    category: "CARD_TYPE",
    title: "Cartão de programa social — restrições a compras online",
    description: "Cartão vinculado a programa social (INSS, Auxílio Brasil, Caixa Tem). Possui restrições a compras online e internacionais. Exige CPF vinculado. Saldo limitado.",
    recommendation: "Verificar CPF vinculado ao cartão. Rejeitar transações internacionais.",
    riskImpact: 10,
  },
  REJEICAO_GATEWAY_INTERNACIONAL: {
    id: "REJEICAO_GATEWAY_INTERNACIONAL",
    severity: "INFO",
    category: "CARD_TYPE",
    title: "Cartão pode ser rejeitado por gateways internacionais",
    description: "Este tipo de cartão (social/pré-pago governamental) é frequentemente rejeitado por gateways internacionais que não reconhecem o BIN ou exigem validação de endereço (AVS).",
    recommendation: "Verificar compatibilidade do gateway com cartões de programas sociais brasileiros.",
    riskImpact: 5,
  },
  INCOMPATIVEL_GATEWAYS_LEGADOS: {
    id: "INCOMPATIVEL_GATEWAYS_LEGADOS",
    severity: "AVISO",
    category: "GATEWAY_RISK",
    title: "Cartão incompatível com gateways legados",
    description: "Este cartão com CVV dinâmico pode causar falhas em gateways que armazenam ou reutilizam CVV, ou que não suportam autenticação por token real-time.",
    recommendation: "Verificar se o gateway suporta CVV dinâmico e autenticação por token.",
    riskImpact: 5,
  },

  // ── COMPLIANCE ALERTS ────────────────────────────────────────────────────
  IP_PAIS_MISMATCH_ATIVA_3DS: {
    id: "IP_PAIS_MISMATCH_ATIVA_3DS",
    severity: "AVISO",
    category: "COMPLIANCE",
    title: "IP de país diferente do BIN pode ativar 3DS",
    description: "Este emissor ativa o 3DS quando detecta que o IP da transação é de um país diferente do país de emissão do cartão.",
    recommendation: "Registrar e monitorar discrepâncias de geolocalização IP vs. país do BIN.",
    riskImpact: 15,
  },
  REJEITA_RETRY_SEM_3DS: {
    id: "REJEITA_RETRY_SEM_3DS",
    severity: "INFO",
    category: "COMPLIANCE",
    title: "Emissor rejeita retry sem 3DS",
    description: "Este emissor rejeita automaticamente tentativas de reprocessamento (retry) de transações que não passaram pelo 3DS.",
    recommendation: "Não tentar reprocessar transações rejeitadas sem incluir o fluxo 3DS completo.",
    riskImpact: -5,
  },
  BLOQUEIO_AUTOMATICO_FALHA_3DS: {
    id: "BLOQUEIO_AUTOMATICO_FALHA_3DS",
    severity: "INFO",
    category: "COMPLIANCE",
    title: "Cartão bloqueado automaticamente se 3DS falhar",
    description: "Este emissor bloqueia o cartão automaticamente se o processo de autenticação 3DS falhar ou for abandonado.",
    recommendation: "Implementar fluxo de recuperação de autenticação para evitar bloqueios acidentais.",
    riskImpact: -5,
  },
  SEM_FALLBACK: {
    id: "SEM_FALLBACK",
    severity: "INFO",
    category: "COMPLIANCE",
    title: "Emissor não permite fallback de 3DS",
    description: "Este emissor não aceita transações sem 3DS completo. Não há fallback para aprovação sem autenticação.",
    recommendation: "Garantir implementação completa de 3DS no gateway. Não tentar contornar.",
    riskImpact: -10,
  },
  ALTO_RISCO_FRAUDE: {
    id: "ALTO_RISCO_FRAUDE",
    severity: "CRITICO",
    category: "BYPASS_RISK",
    title: "BIN com alto histórico de uso em fraudes",
    description: "Este BIN/emissor tem histórico documentado de uso em operações fraudulentas, especialmente em compras online sem autenticação.",
    recommendation: "Bloquear preventivamente ou exigir verificação manual para todas as transações.",
    riskImpact: 40,
  },
  "3DS_VIA_APP_OBRIGATORIO": {
    id: "3DS_VIA_APP_OBRIGATORIO",
    severity: "INFO",
    category: "3DS_BEHAVIOR",
    title: "3DS obrigatório via aplicativo — canal seguro",
    description: "Este emissor implementa 3DS obrigatório via canal protegido do aplicativo móvel (não SMS). Maior segurança, mas requer que o portador tenha o app instalado.",
    recommendation: "Verificar se o portador tem o app instalado. Transações sem app podem ser rejeitadas.",
    riskImpact: -10,
  },
  "3DS_DINAMICO": {
    id: "3DS_DINAMICO",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "3DS dinâmico por valor e perfil do comerciante",
    description: "Este emissor ativa 3DS dinamicamente baseado no valor da transação e no MCC (Merchant Category Code) do comerciante. Compras abaixo do limiar ou em MCCs de baixo risco podem não acionar 3DS.",
    recommendation: "Monitorar padrões de aprovação por valor e MCC. Aplicar verificação adicional em MCCs sensíveis.",
    riskImpact: 15,
  },
  FRICTIONLESS_IP_DEPENDENTE: {
    id: "FRICTIONLESS_IP_DEPENDENTE",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "Fluxo frictionless dependente de IP limpo",
    description: "Este emissor aplica frictionless flow apenas quando o IP da transação tem histórico limpo. IPs novos ou suspeitos acionam desafio 3DS.",
    recommendation: "Monitorar reputação de IP. Transações de IPs novos/VPN com este BIN devem receber score adicional.",
    riskImpact: 10,
  },
  FRICTIONLESS_POSSIVEL_DEVICE_REPETIDO: {
    id: "FRICTIONLESS_POSSIVEL_DEVICE_REPETIDO",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "Frictionless possível com device reconhecido",
    description: "Este emissor aplica frictionless flow quando o device fingerprint é reconhecido de transações anteriores.",
    recommendation: "Verificar histórico do device. Devices novos com este BIN devem receber score adicional.",
    riskImpact: 10,
  },
  FRICTIONLESS_POSSIVEL_DEVICE_HASH: {
    id: "FRICTIONLESS_POSSIVEL_DEVICE_HASH",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "Frictionless via device hash em alguns casos",
    description: "Este emissor pode aplicar frictionless flow baseado em device hash em algumas implementações de gateway.",
    recommendation: "Monitorar padrões de device fingerprint.",
    riskImpact: 10,
  },
  FRICTIONLESS_ALTO: {
    id: "FRICTIONLESS_ALTO",
    severity: "AVISO",
    category: "3DS_BEHAVIOR",
    title: "Alta probabilidade de fluxo frictionless",
    description: "Este emissor tem alta taxa de aprovação via 3DS frictionless flow.",
    recommendation: "Aplicar verificação adicional para transações de alto valor.",
    riskImpact: 20,
  },
  FRICTIONLESS_POSSIVEL: {
    id: "FRICTIONLESS_POSSIVEL",
    severity: "INFO",
    category: "3DS_BEHAVIOR",
    title: "Fluxo frictionless possível em baixo risco",
    description: "Este emissor pode aplicar frictionless flow em transações de baixo risco.",
    recommendation: "Monitorar padrões de autenticação.",
    riskImpact: 10,
  },
  ISENCAO_B2B_CORPORATIVO: {
    id: "ISENCAO_B2B_CORPORATIVO",
    severity: "AVISO",
    category: "BYPASS_RISK",
    title: "Isenção B2B para cartões corporativos",
    description: "Cartões empresariais deste emissor podem ter isenção B2B aplicada automaticamente.",
    recommendation: "Verificar natureza da empresa e aplicar verificação adicional.",
    riskImpact: 20,
  },
  COMPORTAMENTO_VARIAVEL_POR_PAIS: {
    id: "COMPORTAMENTO_VARIAVEL_POR_PAIS",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Comportamento 3DS variável por país",
    description: "Este emissor apresenta comportamento de autenticação diferente dependendo do país de origem da transação.",
    recommendation: "Monitorar país de origem da transação vs. país do BIN.",
    riskImpact: 10,
  },
  IFRAME_FAILURE_BLOCKS_CARD: {
    id: "IFRAME_FAILURE_BLOCKS_CARD",
    severity: "AVISO",
    category: "ISSUER_SPECIFIC",
    title: "Falha no iframe 3DS pode bloquear o cartão",
    description: "Este emissor bloqueia o cartão se o processo de autenticação via iframe for iniciado e não completado.",
    recommendation: "Implementar tratamento de erro adequado no iframe 3DS. Não iniciar 3DS sem garantir que o usuário completará o fluxo.",
    riskImpact: 0,
  },
}

// ─── Alert Generation Engine ────────────────────────────────────────────────

export function generateFraudAlerts(
  technicalData: TechnicalData,
  threeDSAnalysis: ThreeDSAnalysis,
  riskAnalysis: RiskAnalysis,
  issuerProfile: IssuerProfile | null,
): FraudAlert[] {
  const alerts: FraudAlert[] = []
  const addAlert = (id: string) => {
    const alert = FRAUD_ALERT_DEFINITIONS[id]
    if (alert && !alerts.find(a => a.id === id)) {
      alerts.push(alert)
    }
  }

  // Alerts from issuer profile
  if (issuerProfile) {
    for (const alertId of issuerProfile.alerts) {
      addAlert(alertId)
    }

    // Derived alerts from issuer properties
    if (issuerProfile.cvvDynamic) addAlert("CVV_DINAMICO")
    if (issuerProfile.multipleAttemptsAllowed) addAlert("MULTIPLAS_TENTATIVAS")
    if (issuerProfile.silentDeclineRisk) addAlert("SILENT_DECLINE_RISK")
    if (issuerProfile.newCardDelay3DS) addAlert("NOVO_CARTAO_SEM_3DS_INICIAL")
    if (issuerProfile.whiteLabel) addAlert("WHITE_LABEL_COMPORTAMENTO_DIFERENTE")
    if (!issuerProfile.threeDSActive) addAlert("SEM_3DS")

    // Frictionless likelihood alerts
    if (issuerProfile.frictionlessLikelihood === "MUITO_ALTA") addAlert("FRICTIONLESS_MUITO_ALTO")
    else if (issuerProfile.frictionlessLikelihood === "ALTA") addAlert("FRICTIONLESS_ALTO")

    // Bypass mechanism alerts
    if (issuerProfile.bypassMechanism === "SCA_EXEMPTION_B2B") addAlert("ISENCAO_B2B_PROVAVEL")
    if (issuerProfile.bypassMechanism === "3DS_NOMINAL") addAlert("3DS_NOMINAL")
    if (issuerProfile.bypassMechanism === "GATEWAY_FALLBACK") addAlert("GATEWAY_FALLBACK_POSSIVEL")
    if (issuerProfile.bypassMechanism === "SCA_EXEMPTION_LOW_VALUE") addAlert("ISENCAO_BAIXO_VALOR")
  }

  // Alerts from technical data
  if (technicalData.isCommercial) {
    addAlert("ISENCAO_B2B_PROVAVEL")
    addAlert("BYPASS_CORPORATIVO")
  }

  if (technicalData.isPrepaid) {
    // Prepaid cards have higher fraud risk
    if (riskAnalysis.score > 50) addAlert("ALTO_RISCO_FRAUDE")
  }

  // Alerts from 3DS analysis
  if (threeDSAnalysis.status === "INATIVO_PROVAVEL" || threeDSAnalysis.status === "CONFIRMADO_INATIVO") {
    addAlert("SEM_3DS")
  }

  if (threeDSAnalysis.challengeLikelihood === "BAIXA") {
    addAlert("FRICTIONLESS_POSSIVEL")
  }

  // Sort by severity
  const severityOrder: Record<AlertSeverity, number> = {
    CRITICO: 0,
    ALTO: 1,
    AVISO: 2,
    INFO: 3,
  }

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

export function getAlertsByCategory(alerts: FraudAlert[], category: AlertCategory): FraudAlert[] {
  return alerts.filter(a => a.category === category)
}

export function calculateAlertRiskImpact(alerts: FraudAlert[]): number {
  return alerts.reduce((sum, alert) => sum + alert.riskImpact, 0)
}
