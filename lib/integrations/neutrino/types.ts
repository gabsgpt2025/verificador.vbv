export type NeutrinoRequestValue = string | number | boolean | null | undefined
export type NeutrinoRequestPayload = Record<string, NeutrinoRequestValue>
export type NeutrinoResponsePayload = Record<string, unknown>

export interface IpInfoRequest extends NeutrinoRequestPayload {
  ip: string
}
export interface IpInfoResponse extends NeutrinoResponsePayload {
  ip?: string
  country?: string
}

export interface IpBlocklistRequest extends NeutrinoRequestPayload {
  ip: string
}
export interface IpBlocklistResponse extends NeutrinoResponsePayload {
  ip?: string
  is_listed?: boolean
}

export interface IpProbeRequest extends NeutrinoRequestPayload {
  ip: string
}
export interface IpProbeResponse extends NeutrinoResponsePayload {
  ip?: string
  valid?: boolean
}

export interface UaLookupRequest extends NeutrinoRequestPayload {
  ua: string
}
export interface UaLookupResponse extends NeutrinoResponsePayload {
  browser?: string
  os?: string
  is_bot?: boolean
}

export interface HostReputationRequest extends NeutrinoRequestPayload {
  host: string
}
export interface HostReputationResponse extends NeutrinoResponsePayload {
  host?: string
  is_listed?: boolean
}

export interface BadWordFilterRequest extends NeutrinoRequestPayload {
  content: string
}
export interface BadWordFilterResponse extends NeutrinoResponsePayload {
  censored_content?: string
  is_bad?: boolean
}

export interface EmailValidateRequest extends NeutrinoRequestPayload {
  email: string
}
export interface EmailValidateResponse extends NeutrinoResponsePayload {
  valid?: boolean
}

export interface PhoneValidateRequest extends NeutrinoRequestPayload {
  number: string
}
export interface PhoneValidateResponse extends NeutrinoResponsePayload {
  valid?: boolean
}

export interface BinListDownloadRequest extends NeutrinoRequestPayload {}
export interface BinListDownloadResponse extends NeutrinoResponsePayload {
  url?: string
}

export interface ConvertRequest extends NeutrinoRequestPayload {
  from_value: number
  from_type: string
  to_type: string
}
export interface ConvertResponse extends NeutrinoResponsePayload {
  result?: number
}

export interface GeocodeAddressRequest extends NeutrinoRequestPayload {
  address: string
}
export interface GeocodeAddressResponse extends NeutrinoResponsePayload {
  latitude?: number
  longitude?: number
}

export interface GeocodeReverseRequest extends NeutrinoRequestPayload {
  latitude: number
  longitude: number
}
export interface GeocodeReverseResponse extends NeutrinoResponsePayload {
  address?: string
}

export interface HtmlRenderRequest extends NeutrinoRequestPayload {
  content: string
}
export interface HtmlRenderResponse extends NeutrinoResponsePayload {
  image_url?: string
}

export interface ImageResizeRequest extends NeutrinoRequestPayload {
  image_url: string
}
export interface ImageResizeResponse extends NeutrinoResponsePayload {
  image_url?: string
}

export interface ImageWatermarkRequest extends NeutrinoRequestPayload {
  image_url: string
}
export interface ImageWatermarkResponse extends NeutrinoResponsePayload {
  image_url?: string
}

export interface QrCodeRequest extends NeutrinoRequestPayload {
  content: string
}
export interface QrCodeResponse extends NeutrinoResponsePayload {
  qr_code?: string
}

export interface DomainLookupRequest extends NeutrinoRequestPayload {
  host: string
}
export interface DomainLookupResponse extends NeutrinoResponsePayload {
  domain?: string
  tld?: string
}

export interface EmailVerifyRequest extends NeutrinoRequestPayload {
  email: string
}
export interface EmailVerifyResponse extends NeutrinoResponsePayload {
  valid?: boolean
  deliverable?: boolean
}

export interface IpBlocklistDownloadRequest extends NeutrinoRequestPayload {}
export interface IpBlocklistDownloadResponse extends NeutrinoResponsePayload {
  url?: string
}

export interface HlrLookupRequest extends NeutrinoRequestPayload {
  number: string
}
export interface HlrLookupResponse extends NeutrinoResponsePayload {
  valid?: boolean
}

export interface PhonePlaybackRequest extends NeutrinoRequestPayload {
  number: string
}
export interface PhonePlaybackResponse extends NeutrinoResponsePayload {
  calling?: boolean
}

export interface PhoneVerifyRequest extends NeutrinoRequestPayload {
  number: string
}
export interface PhoneVerifyResponse extends NeutrinoResponsePayload {
  verified?: boolean
}

export interface SmsVerifyRequest extends NeutrinoRequestPayload {
  number: string
}
export interface SmsVerifyResponse extends NeutrinoResponsePayload {
  verified?: boolean
}

export interface VerifySecurityCodeRequest extends NeutrinoRequestPayload {
  security_code: string
}
export interface VerifySecurityCodeResponse extends NeutrinoResponsePayload {
  verified?: boolean
}

export interface BrowserBotRequest extends NeutrinoRequestPayload {
  url: string
}
export interface BrowserBotResponse extends NeutrinoResponsePayload {
  is_bot?: boolean
}

export interface HtmlCleanRequest extends NeutrinoRequestPayload {
  content: string
}
export interface HtmlCleanResponse extends NeutrinoResponsePayload {
  clean?: string
}

export interface UrlInfoRequest extends NeutrinoRequestPayload {
  url: string
}
export interface UrlInfoResponse extends NeutrinoResponsePayload {
  valid?: boolean
  host?: string
}

export interface MultiRequest extends NeutrinoRequestPayload {}
export interface MultiResponse extends NeutrinoResponsePayload {
  results?: unknown[]
}

export interface PingRequest extends NeutrinoRequestPayload {
  host: string
}
export interface PingResponse extends NeutrinoResponsePayload {
  alive?: boolean
}

export interface StatsRequest extends NeutrinoRequestPayload {}
export interface StatsResponse extends NeutrinoResponsePayload {
  api_calls?: number
}
