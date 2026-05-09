/**
 * FraudLabs Pro — Tipos de integração
 *
 * Referência: https://www.fraudlabspro.com/developer/api/screen-order
 */

export interface FraudLabsScreenRequest {
  /** IP do visitante */
  ip?: string
  /** Primeiros 6-9 dígitos + últimos 4 dígitos do cartão */
  bin_no?: string
  /** Valor da transação */
  amount?: number
  /** Moeda ISO 4217 */
  currency?: string
  /** País do merchant ISO 3166-1 alpha-2 */
  user_order_memo?: string
  /** User-Agent do navegador */
  flp_checksum?: string
}

export interface FraudLabsScreenResponse {
  /** ID único da transação no FraudLabs Pro */
  fraudlabspro_id: string
  /** Score de fraude (0-100, 0=mais seguro) */
  fraudlabspro_score: number
  /** Status: APPROVE, REJECT, REVIEW */
  fraudlabspro_status: "APPROVE" | "REJECT" | "REVIEW"
  /** Mensagem do sistema */
  fraudlabspro_message: string
  /** Créditos restantes na conta */
  fraudlabspro_credits: number

  // ── IP Analysis ──
  ip_country: string
  ip_continent: string
  ip_region: string
  ip_city: string
  ip_isp: string
  ip_domain: string
  ip_timezone: string
  ip_latitude: string
  ip_longitude: string
  ip_netspeed: string
  ip_usage_type: string
  is_proxy_ip_address: string
  is_free_email: string
  is_disposable_email: string
  is_country_match: string

  // ── BIN Analysis ──
  bin_country: string
  bin_country_code: string
  bin_name: string
  bin_phone: string
  bin_prepaid: string

  // ── Risk indicators ──
  is_ip_blacklist: string
  is_high_risk_country: string
  is_bin_found: string

  // ── Error handling ──
  fraudlabspro_error_code?: string
  fraudlabspro_error?: string
}

/**
 * Resultado normalizado do FraudLabs Pro para uso interno.
 */
export interface FraudLabsResult {
  /** Score de fraude (0-100) — 0 é mais seguro */
  fraudScore: number
  /** Status da decisão */
  status: "APPROVE" | "REJECT" | "REVIEW"
  /** País do IP detectado */
  ipCountry: string | null
  /** ISP do IP */
  ipIsp: string | null
  /** Se o IP é proxy */
  isProxy: boolean
  /** Se o país do IP corresponde ao BIN */
  isCountryMatch: boolean
  /** Se o IP está em blacklist */
  isIpBlacklisted: boolean
  /** Se é país de alto risco */
  isHighRiskCountry: boolean
  /** Se o BIN foi encontrado */
  isBinFound: boolean
  /** Se é cartão pré-pago */
  isBinPrepaid: boolean
  /** País do BIN detectado */
  binCountry: string | null
  /** Emissor do BIN */
  binIssuer: string | null
  /** Créditos restantes */
  creditsRemaining: number
  /** Timestamp da consulta */
  queriedAt: string
  /** Dados brutos da API */
  raw: FraudLabsScreenResponse
}
