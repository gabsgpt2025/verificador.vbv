import * as crypto from "node:crypto"

export interface OAuthParams {
  consumerKey: string
  privateKeyPem: string
  method: "GET" | "POST"
  url: string
  body?: string
  queryParams?: Record<string, string>
}

type OAuthHeaderParams = Record<string, string>

function percentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function normalizeUrl(url: string) {
  const parsed = new URL(url)
  const port =
    (parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")
      ? ""
      : parsed.port
  const pathname = parsed.pathname || "/"
  return `${parsed.protocol}//${parsed.hostname}${port ? `:${port}` : ""}${pathname}`
}

function buildParameterEntries(url: string, queryParams?: Record<string, string>) {
  const parsed = new URL(url)
  const entries: Array<[string, string]> = []

  for (const [key, value] of parsed.searchParams.entries()) {
    entries.push([key, value])
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      entries.push([key, value])
    }
  }

  return entries
}

function buildParameterString(parameters: Record<string, string>, queryEntries: Array<[string, string]>) {
  return [...Object.entries(parameters), ...queryEntries]
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue)
      }
      return leftKey.localeCompare(rightKey)
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
}

function buildSignatureBaseString(method: OAuthParams["method"], normalizedUrl: string, parameterString: string) {
  return [method.toUpperCase(), percentEncode(normalizedUrl), percentEncode(parameterString)].join("&")
}

function buildOAuthHeader(parameters: OAuthHeaderParams) {
  const headerValue = Object.entries(parameters)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ")

  return `OAuth ${headerValue}`
}

export function loadPrivateKeyFromEnv(): string | null {
  const rawValue = process.env.MASTERCARD_PRIVATE_KEY?.trim()
  if (!rawValue) {
    return null
  }

  const normalizedRaw = rawValue.includes("\\n") ? rawValue.replace(/\\n/g, "\n") : rawValue
  if (normalizedRaw.includes("-----BEGIN")) {
    return normalizedRaw
  }

  try {
    const decoded = Buffer.from(normalizedRaw, "base64").toString("utf8").replace(/\\n/g, "\n").trim()
    return decoded.includes("-----BEGIN") ? decoded : null
  } catch {
    return null
  }
}

export function signRequest(params: OAuthParams): { authorizationHeader: string } {
  const oauthParameters: OAuthHeaderParams = {
    oauth_consumer_key: params.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "RSA-SHA256",
    oauth_timestamp: Math.floor(Date.now() / 1_000).toString(),
    oauth_version: "1.0",
  }

  if (params.method === "POST" && params.body !== undefined) {
    oauthParameters.oauth_body_hash = crypto.createHash("sha256").update(params.body).digest("base64")
  }

  const normalizedUrl = normalizeUrl(params.url)
  const queryEntries = buildParameterEntries(params.url, params.queryParams)
  const parameterString = buildParameterString(oauthParameters, queryEntries)
  const signatureBaseString = buildSignatureBaseString(params.method, normalizedUrl, parameterString)

  const signature = crypto.createSign("RSA-SHA256").update(signatureBaseString).sign(params.privateKeyPem, "base64")
  oauthParameters.oauth_signature = signature

  return {
    authorizationHeader: buildOAuthHeader(oauthParameters),
  }
}
