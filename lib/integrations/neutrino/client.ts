import { getEnv } from "@/lib/env"
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
  HostReputationRequest,
  HostReputationResponse,
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
  IpBlocklistRequest,
  IpBlocklistResponse,
  IpInfoRequest,
  IpInfoResponse,
  IpProbeRequest,
  IpProbeResponse,
  MultiRequest,
  MultiResponse,
  NeutrinoRequestPayload,
  NeutrinoResponsePayload,
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
  UaLookupRequest,
  UaLookupResponse,
  UrlInfoRequest,
  UrlInfoResponse,
  VerifySecurityCodeRequest,
  VerifySecurityCodeResponse,
} from "./types"

const NEUTRINO_BASE_URL = "https://neutrinoapi.net"
const NEUTRINO_TIMEOUT_MS = 5000

type Env = ReturnType<typeof getEnv>
type NeutrinoEnabledFlag = keyof Pick<
  Env,
  | "NEUTRINO_IP_INFO_ENABLED"
  | "NEUTRINO_IP_BLOCKLIST_ENABLED"
  | "NEUTRINO_IP_PROBE_ENABLED"
  | "NEUTRINO_UA_LOOKUP_ENABLED"
  | "NEUTRINO_HOST_REPUTATION_ENABLED"
  | "NEUTRINO_BAD_WORD_FILTER_ENABLED"
  | "NEUTRINO_EMAIL_VALIDATE_ENABLED"
  | "NEUTRINO_PHONE_VALIDATE_ENABLED"
  | "NEUTRINO_BIN_LIST_DOWNLOAD_ENABLED"
  | "NEUTRINO_CONVERT_ENABLED"
  | "NEUTRINO_GEOCODE_ADDRESS_ENABLED"
  | "NEUTRINO_GEOCODE_REVERSE_ENABLED"
  | "NEUTRINO_HTML_RENDER_ENABLED"
  | "NEUTRINO_IMAGE_RESIZE_ENABLED"
  | "NEUTRINO_IMAGE_WATERMARK_ENABLED"
  | "NEUTRINO_QR_CODE_ENABLED"
  | "NEUTRINO_DOMAIN_LOOKUP_ENABLED"
  | "NEUTRINO_EMAIL_VERIFY_ENABLED"
  | "NEUTRINO_IP_BLOCKLIST_DOWNLOAD_ENABLED"
  | "NEUTRINO_HLR_LOOKUP_ENABLED"
  | "NEUTRINO_PHONE_PLAYBACK_ENABLED"
  | "NEUTRINO_PHONE_VERIFY_ENABLED"
  | "NEUTRINO_SMS_VERIFY_ENABLED"
  | "NEUTRINO_VERIFY_SECURITY_CODE_ENABLED"
  | "NEUTRINO_BROWSER_BOT_ENABLED"
  | "NEUTRINO_HTML_CLEAN_ENABLED"
  | "NEUTRINO_URL_INFO_ENABLED"
  | "NEUTRINO_MULTI_ENABLED"
  | "NEUTRINO_PING_ENABLED"
  | "NEUTRINO_STATS_ENABLED"
>

function toFormUrlEncoded(payload: NeutrinoRequestPayload): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      continue
    }

    params.set(key, String(value))
  }

  return params.toString()
}

export function isNeutrinoEndpointEnabled(flag: NeutrinoEnabledFlag): boolean {
  const env = getEnv()
  return env[flag]
}

export function isNeutrinoConfigured(): boolean {
  const env = getEnv()
  return Boolean(env.NEUTRINO_API_KEY?.trim() && env.NEUTRINO_USER_ID?.trim())
}

async function callNeutrinoEndpoint<TResponse extends NeutrinoResponsePayload>(
  endpoint: string,
  enabledFlag: NeutrinoEnabledFlag,
  payload: NeutrinoRequestPayload,
): Promise<TResponse | null> {
  const env = getEnv()
  if (!env[enabledFlag]) {
    return null
  }

  const apiKey = env.NEUTRINO_API_KEY?.trim()
  const userId = env.NEUTRINO_USER_ID?.trim()
  if (!apiKey || !userId) {
    return null
  }

  const response = await fetch(`${NEUTRINO_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "User-ID": userId,
      "API-Key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toFormUrlEncoded(payload),
    signal: AbortSignal.timeout(NEUTRINO_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Neutrino API error (${endpoint}): ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as TResponse
}

function createNeutrinoClient<TRequest extends NeutrinoRequestPayload, TResponse extends NeutrinoResponsePayload>(
  endpoint: string,
  enabledFlag: NeutrinoEnabledFlag,
) {
  return (payload: TRequest) => callNeutrinoEndpoint<TResponse>(endpoint, enabledFlag, payload)
}

export const callNeutrinoIpInfo = createNeutrinoClient<IpInfoRequest, IpInfoResponse>("ip-info", "NEUTRINO_IP_INFO_ENABLED")
export const callNeutrinoIpBlocklist = createNeutrinoClient<IpBlocklistRequest, IpBlocklistResponse>(
  "ip-blocklist",
  "NEUTRINO_IP_BLOCKLIST_ENABLED",
)
export const callNeutrinoIpProbe = createNeutrinoClient<IpProbeRequest, IpProbeResponse>("ip-probe", "NEUTRINO_IP_PROBE_ENABLED")
export const callNeutrinoUaLookup = createNeutrinoClient<UaLookupRequest, UaLookupResponse>(
  "ua-lookup",
  "NEUTRINO_UA_LOOKUP_ENABLED",
)
export const callNeutrinoHostReputation = createNeutrinoClient<HostReputationRequest, HostReputationResponse>(
  "host-reputation",
  "NEUTRINO_HOST_REPUTATION_ENABLED",
)

export const callNeutrinoBadWordFilter = createNeutrinoClient<BadWordFilterRequest, BadWordFilterResponse>(
  "bad-word-filter",
  "NEUTRINO_BAD_WORD_FILTER_ENABLED",
)
export const callNeutrinoEmailValidate = createNeutrinoClient<EmailValidateRequest, EmailValidateResponse>(
  "email-validate",
  "NEUTRINO_EMAIL_VALIDATE_ENABLED",
)
export const callNeutrinoPhoneValidate = createNeutrinoClient<PhoneValidateRequest, PhoneValidateResponse>(
  "phone-validate",
  "NEUTRINO_PHONE_VALIDATE_ENABLED",
)

export const callNeutrinoBinListDownload = createNeutrinoClient<BinListDownloadRequest, BinListDownloadResponse>(
  "bin-list-download",
  "NEUTRINO_BIN_LIST_DOWNLOAD_ENABLED",
)
export const callNeutrinoConvert = createNeutrinoClient<ConvertRequest, ConvertResponse>("convert", "NEUTRINO_CONVERT_ENABLED")

export const callNeutrinoGeocodeAddress = createNeutrinoClient<GeocodeAddressRequest, GeocodeAddressResponse>(
  "geocode-address",
  "NEUTRINO_GEOCODE_ADDRESS_ENABLED",
)
export const callNeutrinoGeocodeReverse = createNeutrinoClient<GeocodeReverseRequest, GeocodeReverseResponse>(
  "geocode-reverse",
  "NEUTRINO_GEOCODE_REVERSE_ENABLED",
)

export const callNeutrinoHtmlRender = createNeutrinoClient<HtmlRenderRequest, HtmlRenderResponse>(
  "html-render",
  "NEUTRINO_HTML_RENDER_ENABLED",
)
export const callNeutrinoImageResize = createNeutrinoClient<ImageResizeRequest, ImageResizeResponse>(
  "image-resize",
  "NEUTRINO_IMAGE_RESIZE_ENABLED",
)
export const callNeutrinoImageWatermark = createNeutrinoClient<ImageWatermarkRequest, ImageWatermarkResponse>(
  "image-watermark",
  "NEUTRINO_IMAGE_WATERMARK_ENABLED",
)
export const callNeutrinoQrCode = createNeutrinoClient<QrCodeRequest, QrCodeResponse>("qr-code", "NEUTRINO_QR_CODE_ENABLED")

export const callNeutrinoDomainLookup = createNeutrinoClient<DomainLookupRequest, DomainLookupResponse>(
  "domain-lookup",
  "NEUTRINO_DOMAIN_LOOKUP_ENABLED",
)
export const callNeutrinoEmailVerify = createNeutrinoClient<EmailVerifyRequest, EmailVerifyResponse>(
  "email-verify",
  "NEUTRINO_EMAIL_VERIFY_ENABLED",
)
export const callNeutrinoIpBlocklistDownload = createNeutrinoClient<IpBlocklistDownloadRequest, IpBlocklistDownloadResponse>(
  "ip-blocklist-download",
  "NEUTRINO_IP_BLOCKLIST_DOWNLOAD_ENABLED",
)

export const callNeutrinoHlrLookup = createNeutrinoClient<HlrLookupRequest, HlrLookupResponse>(
  "hlr-lookup",
  "NEUTRINO_HLR_LOOKUP_ENABLED",
)
export const callNeutrinoPhonePlayback = createNeutrinoClient<PhonePlaybackRequest, PhonePlaybackResponse>(
  "phone-playback",
  "NEUTRINO_PHONE_PLAYBACK_ENABLED",
)
export const callNeutrinoPhoneVerify = createNeutrinoClient<PhoneVerifyRequest, PhoneVerifyResponse>(
  "phone-verify",
  "NEUTRINO_PHONE_VERIFY_ENABLED",
)
export const callNeutrinoSmsVerify = createNeutrinoClient<SmsVerifyRequest, SmsVerifyResponse>(
  "sms-verify",
  "NEUTRINO_SMS_VERIFY_ENABLED",
)
export const callNeutrinoVerifySecurityCode = createNeutrinoClient<VerifySecurityCodeRequest, VerifySecurityCodeResponse>(
  "verify-security-code",
  "NEUTRINO_VERIFY_SECURITY_CODE_ENABLED",
)

export const callNeutrinoBrowserBot = createNeutrinoClient<BrowserBotRequest, BrowserBotResponse>(
  "browser-bot",
  "NEUTRINO_BROWSER_BOT_ENABLED",
)
export const callNeutrinoHtmlClean = createNeutrinoClient<HtmlCleanRequest, HtmlCleanResponse>(
  "html-clean",
  "NEUTRINO_HTML_CLEAN_ENABLED",
)
export const callNeutrinoUrlInfo = createNeutrinoClient<UrlInfoRequest, UrlInfoResponse>("url-info", "NEUTRINO_URL_INFO_ENABLED")

export const callNeutrinoMulti = createNeutrinoClient<MultiRequest, MultiResponse>("multi", "NEUTRINO_MULTI_ENABLED")
export const callNeutrinoPing = createNeutrinoClient<PingRequest, PingResponse>("ping", "NEUTRINO_PING_ENABLED")
export const callNeutrinoStats = createNeutrinoClient<StatsRequest, StatsResponse>("stats", "NEUTRINO_STATS_ENABLED")
