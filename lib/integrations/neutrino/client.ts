/**
 * Neutrino API — Cliente centralizado de integração
 *
 * Cada função verifica a flag NEUTRINO_*_ENABLED antes de chamar a API.
 * Retorna null quando a flag está desativada ou as credenciais estão ausentes.
 *
 * Documentação: https://www.neutrinoapi.com/api/
 */

import { createHash } from "crypto"
import { z } from "zod"
import { getEnv, getNeutrinoCredentials } from "@/lib/env"
import { executeNeutrinoRequest } from "@/lib/premium-3-0/neutrino/client"
import type {
  BadWordFilterRequest,
  BadWordFilterResponse,
  BinListDownloadRequest,
  BinListDownloadResponse,
  BrowserBotRequest,
  BrowserBotResponse,
  ConvertRequest,
  ConvertResponse,
  DomainLookupRequest,
  DomainLookupResponse,
  EmailValidateRequest,
  EmailValidateResponse,
  EmailVerifyRequest,
  EmailVerifyResponse,
  GeocodeAddressRequest,
  GeocodeAddressResponse,
  GeocodeReverseRequest,
  GeocodeReverseResponse,
  HlrLookupRequest,
  HlrLookupResponse,
  HtmlCleanRequest,
  HtmlCleanResponse,
  HtmlRenderRequest,
  HtmlRenderResponse,
  ImageResizeRequest,
  ImageResizeResponse,
  ImageWatermarkRequest,
  ImageWatermarkResponse,
  IpBlocklistDownloadRequest,
  IpBlocklistDownloadResponse,
  MultiRequest,
  MultiResponse,
  PhonePlaybackRequest,
  PhonePlaybackResponse,
  PhoneValidateRequest,
  PhoneValidateResponse,
  PhoneVerifyRequest,
  PhoneVerifyResponse,
  PingRequest,
  PingResponse,
  QrCodeRequest,
  QrCodeResponse,
  SmsVerifyRequest,
  SmsVerifyResponse,
  StatsRequest,
  StatsResponse,
  UrlInfoRequest,
  UrlInfoResponse,
  VerifySecurityCodeRequest,
  VerifySecurityCodeResponse,
} from "./types"

const NEUTRINO_BASE_URL = "https://neutrinoapi.net"
const NEUTRINO_TIMEOUT_MS = 4000

// ── Helper: hash content for cache keys ────────────────────────────────────────

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

// ── Helper: binary fetch ────────────────────────────────────────────────────────

async function executeBinaryRequest(endpoint: string, body: Record<string, string>): Promise<ArrayBuffer> {
  const { apiKey, userId } = getNeutrinoCredentials()

  const response = await fetch(`${NEUTRINO_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "User-ID": userId,
      "API-Key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(NEUTRINO_TIMEOUT_MS),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Neutrino API error [${endpoint}]: ${response.status} - ${errorText}`)
  }

  return response.arrayBuffer()
}

// ── Data Tools ─────────────────────────────────────────────────────────────────

const badWordFilterSchema = z
  .object({
    bad_words_total: z.number().optional(),
    bad_words_list: z.array(z.string()).optional(),
    censored_content: z.string().optional(),
    is_bad: z.boolean().optional(),
  })
  .passthrough()

export async function neutrinoBadWordFilter(input: BadWordFilterRequest): Promise<BadWordFilterResponse | null> {
  if (!getEnv().NEUTRINO_BAD_WORD_FILTER_ENABLED) return null

  const body: Record<string, string> = { content: input.content }
  if (input.censor_character) body.censor_character = input.censor_character
  if (input.catalog) body.catalog = input.catalog

  const result = await executeNeutrinoRequest({
    endpoint: "bad-word-filter",
    operation: "bad-word-filter",
    body,
    cacheKey: `neutrino:bad-word-filter:${hashContent(input.content)}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema: badWordFilterSchema,
  })
  return result.data
}

const emailValidateSchema = z
  .object({
    valid: z.boolean().optional(),
    is_freemail: z.boolean().optional(),
    is_disposable: z.boolean().optional(),
    email: z.string().optional(),
    domain: z.string().optional(),
    domain_error: z.boolean().optional(),
    syntax_error: z.boolean().optional(),
    typos_fixed: z.boolean().optional(),
    did_you_mean: z.string().optional(),
    smtp_status: z.string().optional(),
    smtp_response: z.string().optional(),
  })
  .passthrough()

export async function neutrinoEmailValidate(input: EmailValidateRequest): Promise<EmailValidateResponse | null> {
  if (!getEnv().NEUTRINO_EMAIL_VALIDATE_ENABLED) return null

  const body: Record<string, string> = { email: input.email }
  if (input.fix_typos) body.fix_typos = input.fix_typos

  const result = await executeNeutrinoRequest({
    endpoint: "email-validate",
    operation: "email-validate",
    body,
    cacheKey: `neutrino:email-validate:${input.email.toLowerCase()}`,
    cacheTtlSeconds: 60 * 60,
    schema: emailValidateSchema,
  })
  return result.data
}

const phoneValidateSchema = z
  .object({
    valid: z.boolean().optional(),
    international_calling_code: z.string().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    location: z.string().optional(),
    is_mobile: z.boolean().optional(),
    type: z.string().optional(),
    international_number: z.string().optional(),
    local_number: z.string().optional(),
    prefix_network: z.string().optional(),
  })
  .passthrough()

export async function neutrinoPhoneValidate(input: PhoneValidateRequest): Promise<PhoneValidateResponse | null> {
  if (!getEnv().NEUTRINO_PHONE_VALIDATE_ENABLED) return null

  const body: Record<string, string> = { number: input.number }
  if (input.country_code) body.country_code = input.country_code
  if (input.ip) body.ip = input.ip

  const result = await executeNeutrinoRequest({
    endpoint: "phone-validate",
    operation: "phone-validate",
    body,
    cacheKey: `neutrino:phone-validate:${input.number.replace(/\D/g, "")}:${input.country_code ?? ""}`,
    cacheTtlSeconds: 24 * 60 * 60,
    schema: phoneValidateSchema,
  })
  return result.data
}

// ── E-commerce ─────────────────────────────────────────────────────────────────

export async function neutrinoBinListDownload(input: BinListDownloadRequest): Promise<BinListDownloadResponse | null> {
  if (!getEnv().NEUTRINO_BIN_LIST_DOWNLOAD_ENABLED) return null

  const body: Record<string, string> = {}
  if (input.include_iso3) body.include_iso3 = input.include_iso3
  if (input.output_encoding) body.output_encoding = input.output_encoding

  return executeBinaryRequest("bin-list-download", body)
}

const convertSchema = z
  .object({
    valid: z.boolean().optional(),
    result: z.string().optional(),
    result_float: z.number().optional(),
    from_type: z.string().optional(),
    to_type: z.string().optional(),
    from_value: z.string().optional(),
  })
  .passthrough()

export async function neutrinoConvert(input: ConvertRequest): Promise<ConvertResponse | null> {
  if (!getEnv().NEUTRINO_CONVERT_ENABLED) return null

  const result = await executeNeutrinoRequest({
    endpoint: "convert",
    operation: "convert",
    body: {
      from_value: input.from_value,
      from_type: input.from_type,
      to_type: input.to_type,
    },
    cacheKey: `neutrino:convert:${input.from_value}:${input.from_type}:${input.to_type}`,
    cacheTtlSeconds: 60 * 60 * 24,
    schema: convertSchema,
  })
  return result.data
}

// ── Geolocation ────────────────────────────────────────────────────────────────

const geocodeAddressSchema = z
  .object({
    found: z.boolean().optional(),
    total: z.number().optional(),
    locations: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough()

export async function neutrinoGeocodeAddress(input: GeocodeAddressRequest): Promise<GeocodeAddressResponse | null> {
  if (!getEnv().NEUTRINO_GEOCODE_ADDRESS_ENABLED) return null

  const body: Record<string, string> = { address: input.address }
  if (input.language_code) body.language_code = input.language_code
  if (input.country_code) body.country_code = input.country_code
  if (input.address_components) body.address_components = input.address_components
  if (input.fuzzy_search) body.fuzzy_search = input.fuzzy_search

  const result = await executeNeutrinoRequest({
    endpoint: "geocode-address",
    operation: "geocode-address",
    body,
    cacheKey: `neutrino:geocode-address:${input.address.toLowerCase().trim()}`,
    cacheTtlSeconds: 7 * 24 * 60 * 60,
    schema: geocodeAddressSchema,
  })
  return result.data
}

const geocodeReverseSchema = z
  .object({
    found: z.boolean().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    postal_code: z.string().optional(),
    location_type: z.string().optional(),
    location_tags: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    address_components: z.record(z.string(), z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .passthrough()

export async function neutrinoGeocodeReverse(input: GeocodeReverseRequest): Promise<GeocodeReverseResponse | null> {
  if (!getEnv().NEUTRINO_GEOCODE_REVERSE_ENABLED) return null

  const body: Record<string, string> = {
    latitude: input.latitude,
    longitude: input.longitude,
  }
  if (input.language_code) body.language_code = input.language_code
  if (input.zoom) body.zoom = input.zoom

  const result = await executeNeutrinoRequest({
    endpoint: "geocode-reverse",
    operation: "geocode-reverse",
    body,
    cacheKey: `neutrino:geocode-reverse:${input.latitude}:${input.longitude}`,
    cacheTtlSeconds: 7 * 24 * 60 * 60,
    schema: geocodeReverseSchema,
  })
  return result.data
}

// ── Imaging ────────────────────────────────────────────────────────────────────

export async function neutrinoHtmlRender(input: HtmlRenderRequest): Promise<HtmlRenderResponse | null> {
  if (!getEnv().NEUTRINO_HTML_RENDER_ENABLED) return null

  const body: Record<string, string> = { content: input.content }
  if (input.format) body.format = input.format
  if (input.page_width) body.page_width = input.page_width
  if (input.page_height) body.page_height = input.page_height
  if (input.margin) body.margin = input.margin
  if (input.margin_top) body.margin_top = input.margin_top
  if (input.margin_bottom) body.margin_bottom = input.margin_bottom
  if (input.margin_left) body.margin_left = input.margin_left
  if (input.margin_right) body.margin_right = input.margin_right
  if (input.orientation) body.orientation = input.orientation
  if (input.delay) body.delay = input.delay
  if (input.ignore_certificate_errors) body.ignore_certificate_errors = input.ignore_certificate_errors

  return executeBinaryRequest("html-render", body)
}

export async function neutrinoImageResize(input: ImageResizeRequest): Promise<ImageResizeResponse | null> {
  if (!getEnv().NEUTRINO_IMAGE_RESIZE_ENABLED) return null

  const body: Record<string, string> = {
    image_url: input.image_url,
    width: input.width,
    height: input.height,
  }
  if (input.format) body.format = input.format

  return executeBinaryRequest("image-resize", body)
}

export async function neutrinoImageWatermark(input: ImageWatermarkRequest): Promise<ImageWatermarkResponse | null> {
  if (!getEnv().NEUTRINO_IMAGE_WATERMARK_ENABLED) return null

  const body: Record<string, string> = {
    image_url: input.image_url,
    watermark_url: input.watermark_url,
  }
  if (input.opacity) body.opacity = input.opacity
  if (input.position) body.position = input.position
  if (input.format) body.format = input.format
  if (input.width) body.width = input.width
  if (input.height) body.height = input.height

  return executeBinaryRequest("image-watermark", body)
}

export async function neutrinoQrCode(input: QrCodeRequest): Promise<QrCodeResponse | null> {
  if (!getEnv().NEUTRINO_QR_CODE_ENABLED) return null

  const body: Record<string, string> = { content: input.content }
  if (input.width) body.width = input.width
  if (input.height) body.height = input.height
  if (input.format) body.format = input.format
  if (input.fg_color) body.fg_color = input.fg_color
  if (input.bg_color) body.bg_color = input.bg_color

  return executeBinaryRequest("qr-code", body)
}

// ── Security and Networking ────────────────────────────────────────────────────

const domainLookupSchema = z
  .object({
    valid: z.boolean().optional(),
    is_subdomain: z.boolean().optional(),
    tld: z.string().optional(),
    fqdn: z.string().optional(),
    registration_date: z.string().optional(),
    registrant: z.string().optional(),
    registrar: z.string().optional(),
    whois_server: z.string().optional(),
    age: z.number().optional(),
    mail_servers: z.array(z.string()).optional(),
    name_servers: z.array(z.string()).optional(),
    ip_addresses: z.array(z.string()).optional(),
  })
  .passthrough()

export async function neutrinoDomainLookup(input: DomainLookupRequest): Promise<DomainLookupResponse | null> {
  if (!getEnv().NEUTRINO_DOMAIN_LOOKUP_ENABLED) return null

  const body: Record<string, string> = { host: input.host }
  if (input.live) body.live = input.live

  const result = await executeNeutrinoRequest({
    endpoint: "domain-lookup",
    operation: "domain-lookup",
    body,
    cacheKey: `neutrino:domain-lookup:${input.host.toLowerCase()}`,
    cacheTtlSeconds: 60 * 60,
    schema: domainLookupSchema,
  })
  return result.data
}

const emailVerifySchema = z
  .object({
    valid: z.boolean().optional(),
    verified: z.boolean().optional(),
    email: z.string().optional(),
    domain: z.string().optional(),
    is_freemail: z.boolean().optional(),
    is_disposable: z.boolean().optional(),
    is_catchall: z.boolean().optional(),
    smtp_status: z.string().optional(),
    smtp_response: z.string().optional(),
    mx_records: z.array(z.string()).optional(),
    typos_fixed: z.boolean().optional(),
    did_you_mean: z.string().optional(),
  })
  .passthrough()

export async function neutrinoEmailVerify(input: EmailVerifyRequest): Promise<EmailVerifyResponse | null> {
  if (!getEnv().NEUTRINO_EMAIL_VERIFY_ENABLED) return null

  const body: Record<string, string> = { email: input.email }
  if (input.fix_typos) body.fix_typos = input.fix_typos

  const result = await executeNeutrinoRequest({
    endpoint: "email-verify",
    operation: "email-verify",
    body,
    cacheKey: `neutrino:email-verify:${input.email.toLowerCase()}`,
    cacheTtlSeconds: 60 * 60,
    schema: emailVerifySchema,
  })
  return result.data
}

export async function neutrinoIpBlocklistDownload(
  input: IpBlocklistDownloadRequest,
): Promise<IpBlocklistDownloadResponse | null> {
  if (!getEnv().NEUTRINO_IP_BLOCKLIST_DOWNLOAD_ENABLED) return null

  const body: Record<string, string> = {}
  if (input.output_encoding) body.output_encoding = input.output_encoding
  if (input.cidr) body.cidr = input.cidr
  if (input.ip6) body.ip6 = input.ip6
  if (input.category) body.category = input.category

  return executeBinaryRequest("ip-blocklist-download", body)
}

// ── Telephony ─────────────────────────────────────────────────────────────────

const hlrLookupSchema = z
  .object({
    valid: z.boolean().optional(),
    number_valid: z.boolean().optional(),
    international_calling_code: z.string().optional(),
    country_code: z.string().optional(),
    country: z.string().optional(),
    mnc: z.string().optional(),
    mcc: z.string().optional(),
    msin: z.string().optional(),
    imsi: z.string().optional(),
    number_type: z.string().optional(),
    is_ported: z.boolean().optional(),
    is_roaming: z.boolean().optional(),
    roaming_country: z.string().optional(),
    roaming_country_code: z.string().optional(),
    roaming_network: z.string().optional(),
    origin_network: z.string().optional(),
    local_number: z.string().optional(),
    international_number: z.string().optional(),
    hlr_status: z.string().optional(),
    hlr_valid: z.boolean().optional(),
  })
  .passthrough()

export async function neutrinoHlrLookup(input: HlrLookupRequest): Promise<HlrLookupResponse | null> {
  if (!getEnv().NEUTRINO_HLR_LOOKUP_ENABLED) return null

  const body: Record<string, string> = { number: input.number }
  if (input.country_code) body.country_code = input.country_code

  const result = await executeNeutrinoRequest({
    endpoint: "hlr-lookup",
    operation: "hlr-lookup",
    body,
    cacheKey: `neutrino:hlr-lookup:${input.number.replace(/\D/g, "")}:${input.country_code ?? ""}`,
    cacheTtlSeconds: 60 * 60,
    schema: hlrLookupSchema,
  })
  return result.data
}

const phonePlaybackSchema = z
  .object({
    calling: z.boolean().optional(),
    number_valid: z.boolean().optional(),
  })
  .passthrough()

export async function neutrinoPhonePlayback(input: PhonePlaybackRequest): Promise<PhonePlaybackResponse | null> {
  if (!getEnv().NEUTRINO_PHONE_PLAYBACK_ENABLED) return null

  const body: Record<string, string> = {
    number: input.number,
    audio_url: input.audio_url,
  }
  if (input.country_code) body.country_code = input.country_code

  const result = await executeNeutrinoRequest({
    endpoint: "phone-playback",
    operation: "phone-playback",
    body,
    cacheKey: `neutrino:phone-playback:${input.number.replace(/\D/g, "")}`,
    cacheTtlSeconds: 0,
    schema: phonePlaybackSchema,
  })
  return result.data
}

const phoneVerifySchema = z
  .object({
    calling: z.boolean().optional(),
    number_valid: z.boolean().optional(),
    security_code: z.string().optional(),
  })
  .passthrough()

export async function neutrinoPhoneVerify(input: PhoneVerifyRequest): Promise<PhoneVerifyResponse | null> {
  if (!getEnv().NEUTRINO_PHONE_VERIFY_ENABLED) return null

  const body: Record<string, string> = { number: input.number }
  if (input.country_code) body.country_code = input.country_code
  if (input.security_code_length) body.security_code_length = input.security_code_length
  if (input.language_code) body.language_code = input.language_code
  if (input.code_in_phone_number) body.code_in_phone_number = input.code_in_phone_number
  if (input.playback_delay) body.playback_delay = input.playback_delay

  const result = await executeNeutrinoRequest({
    endpoint: "phone-verify",
    operation: "phone-verify",
    body,
    cacheKey: `neutrino:phone-verify:${input.number.replace(/\D/g, "")}`,
    cacheTtlSeconds: 0,
    schema: phoneVerifySchema,
  })
  return result.data
}

const smsVerifySchema = z
  .object({
    sent: z.boolean().optional(),
    number_valid: z.boolean().optional(),
    security_code: z.string().optional(),
  })
  .passthrough()

export async function neutrinoSmsVerify(input: SmsVerifyRequest): Promise<SmsVerifyResponse | null> {
  if (!getEnv().NEUTRINO_SMS_VERIFY_ENABLED) return null

  const body: Record<string, string> = { number: input.number }
  if (input.country_code) body.country_code = input.country_code
  if (input.security_code_length) body.security_code_length = input.security_code_length
  if (input.code_in_phone_number) body.code_in_phone_number = input.code_in_phone_number

  const result = await executeNeutrinoRequest({
    endpoint: "sms-verify",
    operation: "sms-verify",
    body,
    cacheKey: `neutrino:sms-verify:${input.number.replace(/\D/g, "")}`,
    cacheTtlSeconds: 0,
    schema: smsVerifySchema,
  })
  return result.data
}

const verifySecurityCodeSchema = z
  .object({
    verified: z.boolean().optional(),
  })
  .passthrough()

export async function neutrinoVerifySecurityCode(
  input: VerifySecurityCodeRequest,
): Promise<VerifySecurityCodeResponse | null> {
  if (!getEnv().NEUTRINO_VERIFY_SECURITY_CODE_ENABLED) return null

  const result = await executeNeutrinoRequest({
    endpoint: "verify-security-code",
    operation: "verify-security-code",
    body: { security_code: input.security_code },
    cacheKey: `neutrino:verify-security-code:${hashContent(input.security_code)}`,
    cacheTtlSeconds: 0,
    schema: verifySecurityCodeSchema,
  })
  return result.data
}

// ── WWW ───────────────────────────────────────────────────────────────────────

const browserBotSchema = z
  .object({
    content: z.string().optional(),
    url: z.string().optional(),
    title: z.string().optional(),
    status_code: z.number().optional(),
    mime_type: z.string().optional(),
    load_time: z.number().optional(),
    exec_results: z.array(z.string()).optional(),
    error_message: z.string().optional(),
    is_error: z.boolean().optional(),
    is_timeout: z.boolean().optional(),
    is_redirect: z.boolean().optional(),
  })
  .passthrough()

export async function neutrinoBrowserBot(input: BrowserBotRequest): Promise<BrowserBotResponse | null> {
  if (!getEnv().NEUTRINO_BROWSER_BOT_ENABLED) return null

  const body: Record<string, string> = { url: input.url }
  if (input.timeout) body.timeout = input.timeout
  if (input.delay) body.delay = input.delay
  if (input.wait_for) body.wait_for = input.wait_for
  if (input.ignore_certificate_errors) body.ignore_certificate_errors = input.ignore_certificate_errors
  if (input.exec) body.exec = input.exec
  if (input.user_agent) body.user_agent = input.user_agent

  const result = await executeNeutrinoRequest({
    endpoint: "browser-bot",
    operation: "browser-bot",
    body,
    cacheKey: `neutrino:browser-bot:${input.url}`,
    cacheTtlSeconds: 5 * 60,
    schema: browserBotSchema,
  })
  return result.data
}

const htmlCleanSchema = z
  .object({
    output: z.string().optional(),
  })
  .passthrough()

export async function neutrinoHtmlClean(input: HtmlCleanRequest): Promise<HtmlCleanResponse | null> {
  if (!getEnv().NEUTRINO_HTML_CLEAN_ENABLED) return null

  const body: Record<string, string> = { content: input.content }
  if (input.output_type) body.output_type = input.output_type

  const result = await executeNeutrinoRequest({
    endpoint: "html-clean",
    operation: "html-clean",
    body,
    cacheKey: `neutrino:html-clean:${hashContent(input.content)}`,
    cacheTtlSeconds: 60 * 60,
    schema: htmlCleanSchema,
  })
  return result.data
}

const urlInfoSchema = z
  .object({
    url: z.string().optional(),
    content: z.string().optional(),
    mime_type: z.string().optional(),
    title: z.string().optional(),
    real: z.string().optional(),
    status_code: z.number().optional(),
    load_time: z.number().optional(),
    content_size: z.number().optional(),
    is_error: z.boolean().optional(),
    is_timeout: z.boolean().optional(),
    is_redirect: z.boolean().optional(),
    http_ok: z.boolean().optional(),
    http_redirect: z.boolean().optional(),
    server_region: z.string().optional(),
    server_city: z.string().optional(),
    server_country: z.string().optional(),
    server_country_code: z.string().optional(),
    server_hostname: z.string().optional(),
    server_ip: z.string().optional(),
  })
  .passthrough()

export async function neutrinoUrlInfo(input: UrlInfoRequest): Promise<UrlInfoResponse | null> {
  if (!getEnv().NEUTRINO_URL_INFO_ENABLED) return null

  const body: Record<string, string> = { url: input.url }
  if (input.fetch_content) body.fetch_content = input.fetch_content
  if (input.ignore_certificate_errors) body.ignore_certificate_errors = input.ignore_certificate_errors
  if (input.timeout) body.timeout = input.timeout
  if (input.retry) body.retry = input.retry

  const result = await executeNeutrinoRequest({
    endpoint: "url-info",
    operation: "url-info",
    body,
    cacheKey: `neutrino:url-info:${input.url}`,
    cacheTtlSeconds: 5 * 60,
    schema: urlInfoSchema,
  })
  return result.data
}

// ── Util ──────────────────────────────────────────────────────────────────────

const multiSchema = z
  .object({
    responses: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

export async function neutrinoMulti(input: MultiRequest): Promise<MultiResponse | null> {
  if (!getEnv().NEUTRINO_MULTI_ENABLED) return null

  const result = await executeNeutrinoRequest({
    endpoint: "multi",
    operation: "multi",
    body: { requests: input.requests },
    cacheKey: `neutrino:multi:${hashContent(input.requests)}`,
    cacheTtlSeconds: 5 * 60,
    schema: multiSchema,
  })
  return result.data
}

const pingSchema = z
  .object({
    is_reachable: z.boolean().optional(),
    host: z.string().optional(),
    ip: z.string().optional(),
    response_time: z.number().optional(),
    packets_sent: z.number().optional(),
    packets_received: z.number().optional(),
    packet_loss_percent: z.number().optional(),
  })
  .passthrough()

export async function neutrinoPing(input: PingRequest): Promise<PingResponse | null> {
  if (!getEnv().NEUTRINO_PING_ENABLED) return null

  const result = await executeNeutrinoRequest({
    endpoint: "host-reachability",
    operation: "ping",
    body: { host: input.host },
    cacheKey: `neutrino:ping:${input.host.toLowerCase()}`,
    cacheTtlSeconds: 5 * 60,
    schema: pingSchema,
  })
  return result.data
}

const statsSchema = z
  .object({
    requests_today: z.number().optional(),
    requests_remaining: z.number().optional(),
    credits_remaining: z.number().optional(),
    plan: z.string().optional(),
    plan_tier: z.string().optional(),
  })
  .passthrough()

export async function neutrinoStats(_input: StatsRequest): Promise<StatsResponse | null> {
  if (!getEnv().NEUTRINO_STATS_ENABLED) return null

  const result = await executeNeutrinoRequest({
    endpoint: "api-usage",
    operation: "stats",
    body: {},
    cacheKey: `neutrino:stats:${new Date().toISOString().slice(0, 13)}`,
    cacheTtlSeconds: 60 * 60,
    schema: statsSchema,
  })
  return result.data
}

// ── Aliases de compatibilidade (usados em testes e integrações legadas) ─────────
// callNeutrinoBadWordFilter → neutrinoBadWordFilter
export const callNeutrinoBadWordFilter = neutrinoBadWordFilter

// callNeutrinoIpInfo: wrapper direto para o endpoint ip-info da Neutrino API.
// Usado quando se precisa de acesso de baixo nível (sem cache) ao endpoint.
export async function callNeutrinoIpInfo(input: { ip: string }): Promise<Record<string, unknown> | null> {
  if (!getEnv().NEUTRINO_IP_INFO_ENABLED) return null
  const { apiKey, userId } = getNeutrinoCredentials()
  if (!apiKey || !userId) return null
  const response = await fetch(`${NEUTRINO_BASE_URL}/ip-info`, {
    method: "POST",
    headers: {
      "User-ID": userId,
      "API-Key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `ip=${encodeURIComponent(input.ip)}`,
    signal: AbortSignal.timeout(NEUTRINO_TIMEOUT_MS),
  })
  if (!response.ok) return null
  return response.json() as Promise<Record<string, unknown>>
}
