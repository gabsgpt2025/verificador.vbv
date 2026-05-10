/**
 * Neutrino API — Tipos de integração
 *
 * Referência: https://www.neutrinoapi.com/api/
 */

// ── Data Tools ─────────────────────────────────────────────────────────────────

export interface BadWordFilterRequest {
  /** Texto a ser analisado */
  content: string
  /** Tipo de censura: "asterisk" | "remove" | "replace" */
  censor_character?: string
  /** Separador de lista de palavras ruins */
  catalog?: string
}

export interface BadWordFilterResponse {
  bad_words_total?: number
  bad_words_list?: string[]
  censored_content?: string
  is_bad?: boolean
}

export interface EmailValidateRequest {
  /** Endereço de email */
  email: string
  /** Corrigir automaticamente typos comuns */
  fix_typos?: string
}

export interface EmailValidateResponse {
  valid?: boolean
  is_freemail?: boolean
  is_disposable?: boolean
  email?: string
  domain?: string
  domain_error?: boolean
  syntax_error?: boolean
  typos_fixed?: boolean
  did_you_mean?: string
  smtp_status?: string
  smtp_response?: string
}

export interface PhoneValidateRequest {
  /** Número de telefone */
  number: string
  /** Código do país ISO 3166-1 alpha-2 */
  country_code?: string
  /** IP do usuário para detecção de país */
  ip?: string
}

export interface PhoneValidateResponse {
  valid?: boolean
  international_calling_code?: string
  country_code?: string
  country?: string
  location?: string
  is_mobile?: boolean
  type?: string
  international_number?: string
  local_number?: string
  prefix_network?: string
}

// ── E-commerce ─────────────────────────────────────────────────────────────────

export interface BinListDownloadRequest {
  /** Formato de saída: "csv" | "json" */
  include_iso3?: string
  /** Codificação de saída: "utf-8" */
  output_encoding?: string
}

/** Retorna bytes brutos (CSV/texto) */
export type BinListDownloadResponse = ArrayBuffer

export interface ConvertRequest {
  /** Valor a ser convertido */
  from_value: string
  /** Tipo de unidade de origem */
  from_type: string
  /** Tipo de unidade de destino */
  to_type: string
}

export interface ConvertResponse {
  valid?: boolean
  result?: string
  result_float?: number
  from_type?: string
  to_type?: string
  from_value?: string
}

// ── Geolocation ────────────────────────────────────────────────────────────────

export interface GeocodeAddressRequest {
  /** Endereço a geocodificar */
  address: string
  /** Idioma de resposta (padrão: "en") */
  language_code?: string
  /** Código de país para filtrar resultados */
  country_code?: string
  /** Componentes do endereço em JSON */
  address_components?: string
  /** Limite de resultados */
  fuzzy_search?: string
}

export interface GeocodeAddressResponse {
  found?: boolean
  total?: number
  locations?: Array<{
    address?: string
    latitude?: number
    longitude?: number
    city?: string
    state?: string
    country?: string
    country_code?: string
    postal_code?: string
    location_type?: string
    location_tags?: string[]
    timezone?: string
    address_components?: Record<string, string>
  }>
}

export interface GeocodeReverseRequest {
  /** Latitude */
  latitude: string
  /** Longitude */
  longitude: string
  /** Idioma de resposta (padrão: "en") */
  language_code?: string
  /** Zoom de precisão (0-18) */
  zoom?: string
}

export interface GeocodeReverseResponse {
  found?: boolean
  address?: string
  city?: string
  state?: string
  country?: string
  country_code?: string
  postal_code?: string
  location_type?: string
  location_tags?: string[]
  timezone?: string
  address_components?: Record<string, string>
  latitude?: number
  longitude?: number
}

// ── Imaging ────────────────────────────────────────────────────────────────────

export interface HtmlRenderRequest {
  /** Conteúdo HTML ou URL a renderizar */
  content: string
  /** Formato de saída: "pdf" | "png" | "html" */
  format?: string
  /** Largura do viewport em pixels */
  page_width?: string
  /** Altura do viewport em pixels */
  page_height?: string
  /** Margem em mm */
  margin?: string
  /** Margem superior em mm */
  margin_top?: string
  /** Margem inferior em mm */
  margin_bottom?: string
  /** Margem esquerda em mm */
  margin_left?: string
  /** Margem direita em mm */
  margin_right?: string
  /** Orientação de página: "portrait" | "landscape" */
  orientation?: string
  /** Delay em ms antes de capturar */
  delay?: string
  /** Ignorar erros de certificado SSL */
  ignore_certificate_errors?: string
}

/** Retorna bytes brutos (PDF/PNG/HTML) */
export type HtmlRenderResponse = ArrayBuffer

export interface ImageResizeRequest {
  /** URL da imagem a redimensionar */
  image_url: string
  /** Largura em pixels */
  width: string
  /** Altura em pixels */
  height: string
  /** Formato de saída: "png" | "jpg" | "gif" | "webp" */
  format?: string
}

/** Retorna bytes brutos da imagem redimensionada */
export type ImageResizeResponse = ArrayBuffer

export interface ImageWatermarkRequest {
  /** URL da imagem base */
  image_url: string
  /** URL da imagem de marca d'água */
  watermark_url: string
  /** Opacidade da marca d'água (0-100) */
  opacity?: string
  /** Posição: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" */
  position?: string
  /** Formato de saída: "png" | "jpg" */
  format?: string
  /** Largura em pixels */
  width?: string
  /** Altura em pixels */
  height?: string
}

/** Retorna bytes brutos da imagem com marca d'água */
export type ImageWatermarkResponse = ArrayBuffer

export interface QrCodeRequest {
  /** Conteúdo do QR Code */
  content: string
  /** Largura em pixels */
  width?: string
  /** Altura em pixels */
  height?: string
  /** Formato de saída: "png" | "jpg" | "gif" | "svg" */
  format?: string
  /** Cor de primeiro plano (foreground) */
  fg_color?: string
  /** Cor de fundo */
  bg_color?: string
}

/** Retorna bytes brutos da imagem do QR Code */
export type QrCodeResponse = ArrayBuffer

// ── Security and Networking ────────────────────────────────────────────────────

export interface DomainLookupRequest {
  /** Host ou domínio a consultar */
  host: string
  /** Tipo de pesquisa: "domain" | "url" */
  live?: string
}

export interface DomainLookupResponse {
  valid?: boolean
  is_subdomain?: boolean
  tld?: string
  fqdn?: string
  registration_date?: string
  registrant?: string
  registrar?: string
  whois_server?: string
  age?: number
  mail_servers?: string[]
  name_servers?: string[]
  ip_addresses?: string[]
}

export interface EmailVerifyRequest {
  /** Endereço de email a verificar */
  email: string
  /** Fixar typos automaticamente */
  fix_typos?: string
}

export interface EmailVerifyResponse {
  valid?: boolean
  verified?: boolean
  email?: string
  domain?: string
  is_freemail?: boolean
  is_disposable?: boolean
  is_catchall?: boolean
  smtp_status?: string
  smtp_response?: string
  mx_records?: string[]
  typos_fixed?: boolean
  did_you_mean?: string
}

export interface IpBlocklistDownloadRequest {
  /** Formato de saída: "txt" | "cidr" */
  output_encoding?: string
  /** Incluir entradas CIDR */
  cidr?: string
  /** Incluir range IPv6 */
  ip6?: string
  /** Incluir entradas de bots */
  category?: string
}

/** Retorna bytes brutos (texto/CSV) */
export type IpBlocklistDownloadResponse = ArrayBuffer

// ── Telephony ─────────────────────────────────────────────────────────────────

export interface HlrLookupRequest {
  /** Número de telefone celular */
  number: string
  /** Código do país ISO 3166-1 alpha-2 */
  country_code?: string
}

export interface HlrLookupResponse {
  valid?: boolean
  number_valid?: boolean
  international_calling_code?: string
  country_code?: string
  country?: string
  mnc?: string
  mcc?: string
  msin?: string
  imsi?: string
  number_type?: string
  is_ported?: boolean
  is_roaming?: boolean
  roaming_country?: string
  roaming_country_code?: string
  roaming_network?: string
  origin_network?: string
  local_number?: string
  international_number?: string
  hlr_status?: string
  hlr_valid?: boolean
}

export interface PhonePlaybackRequest {
  /** Número de telefone */
  number: string
  /** URL do áudio a reproduzir */
  audio_url: string
  /** Código do país ISO 3166-1 alpha-2 */
  country_code?: string
}

export interface PhonePlaybackResponse {
  calling?: boolean
  number_valid?: boolean
}

export interface PhoneVerifyRequest {
  /** Número de telefone */
  number: string
  /** Código do país ISO 3166-1 alpha-2 */
  country_code?: string
  /** Número de dígitos do código de segurança */
  security_code_length?: string
  /** Idioma da chamada */
  language_code?: string
  /** Prefixo do código de segurança */
  code_in_phone_number?: string
  /** ID da chamada anterior (para reenvio) */
  playback_delay?: string
}

export interface PhoneVerifyResponse {
  calling?: boolean
  number_valid?: boolean
  security_code?: string
}

export interface SmsVerifyRequest {
  /** Número de telefone */
  number: string
  /** Código do país ISO 3166-1 alpha-2 */
  country_code?: string
  /** Número de dígitos do código de segurança */
  security_code_length?: string
  /** Mensagem customizada (use {{code}} para inserir o código) */
  code_in_phone_number?: string
}

export interface SmsVerifyResponse {
  sent?: boolean
  number_valid?: boolean
  security_code?: string
}

export interface VerifySecurityCodeRequest {
  /** Código de segurança recebido pelo usuário */
  security_code: string
}

export interface VerifySecurityCodeResponse {
  verified?: boolean
}

// ── WWW ───────────────────────────────────────────────────────────────────────

export interface BrowserBotRequest {
  /** URL a carregar */
  url: string
  /** Timeout em segundos */
  timeout?: string
  /** Delay em ms após carregar */
  delay?: string
  /** Seletor CSS a aguardar */
  wait_for?: string
  /** Ignorar erros de certificado SSL */
  ignore_certificate_errors?: string
  /** Execução de JavaScript customizado */
  exec?: string
  /** User-Agent customizado */
  user_agent?: string
}

export interface BrowserBotResponse {
  content?: string
  url?: string
  title?: string
  status_code?: number
  mime_type?: string
  load_time?: number
  exec_results?: string[]
  error_message?: string
  is_error?: boolean
  is_timeout?: boolean
  is_redirect?: boolean
}

export interface HtmlCleanRequest {
  /** Conteúdo HTML a limpar */
  content: string
  /** Tipo de saída: "plain-text" | "tidy-html" */
  output_type?: string
}

export interface HtmlCleanResponse {
  output?: string
}

export interface UrlInfoRequest {
  /** URL a analisar */
  url: string
  /** Seguir redirecionamentos */
  fetch_content?: string
  /** Ignorar erros de certificado SSL */
  ignore_certificate_errors?: string
  /** Timeout em segundos */
  timeout?: string
  /** Retry em caso de falha */
  retry?: string
}

export interface UrlInfoResponse {
  url?: string
  content?: string
  mime_type?: string
  title?: string
  real?: string
  status_code?: number
  load_time?: number
  content_size?: number
  is_error?: boolean
  is_timeout?: boolean
  is_redirect?: boolean
  http_ok?: boolean
  http_redirect?: boolean
  server_region?: string
  server_city?: string
  server_country?: string
  server_country_code?: string
  server_hostname?: string
  server_ip?: string
}

// ── Util ──────────────────────────────────────────────────────────────────────

export interface MultiRequest {
  /** Requisições a executar em paralelo (array JSON serializado) */
  requests: string
}

export interface MultiResponse {
  responses?: Record<string, unknown>
}

export interface PingRequest {
  /** Host a verificar (IP ou domínio) */
  host: string
}

export interface PingResponse {
  is_reachable?: boolean
  host?: string
  ip?: string
  response_time?: number
  packets_sent?: number
  packets_received?: number
  packet_loss_percent?: number
}

export interface StatsRequest {
  // sem campos obrigatórios
}

export interface StatsResponse {
  requests_today?: number
  requests_remaining?: number
  credits_remaining?: number
  plan?: string
  plan_tier?: string
}
