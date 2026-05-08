import type { NextRequest } from "next/server"

import type { GeoContext } from "../types"

type HeaderReader = {
  headers: {
    get(name: string): string | null
  }
}

type GeoInput = {
  ipCountry?: string | null
  ipCity?: string | null
  ipLatitude?: string | null
  ipLongitude?: string | null
  realIp?: string | null
}

const COUNTRY_RISK_TIER: Record<string, GeoContext["ipCountryTier"]> = {
  US: "tier1",
  UK: "tier1",
  GB: "tier1",
  DE: "tier1",
  FR: "tier1",
  JP: "tier1",
  BR: "tier2",
  MX: "tier2",
  AR: "tier2",
  PL: "tier3",
  RO: "tier3",
  UA: "tier3",
  BG: "tier3",
  AL: "tier3",
  DZ: "tier3",
  EG: "tier3",
  MA: "tier3",
  TN: "tier3",
  NG: "critical",
  VE: "critical",
  IR: "critical",
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  BR: { lat: -14.235, lng: -51.9253 },
  US: { lat: 39.8283, lng: -98.5795 },
  GB: { lat: 55.3781, lng: -3.436 },
  UK: { lat: 55.3781, lng: -3.436 },
  DE: { lat: 51.1657, lng: 10.4515 },
  FR: { lat: 46.2276, lng: 2.2137 },
  JP: { lat: 36.2048, lng: 138.2529 },
  MX: { lat: 23.6345, lng: -102.5528 },
  AR: { lat: -38.4161, lng: -63.6167 },
  NG: { lat: 9.082, lng: 8.6753 },
  VE: { lat: 6.4238, lng: -66.5897 },
  IR: { lat: 32.4279, lng: 53.688 },
}

function normalizeCountry(country?: string | null) {
  if (!country) return null
  const normalized = country.trim().toUpperCase()
  if (normalized === "UK") return "GB"
  return normalized.length >= 2 ? normalized.slice(0, 2) : null
}

function getTier(country?: string | null): GeoContext["ipCountryTier"] {
  const normalizedCountry = normalizeCountry(country)
  if (!normalizedCountry) {
    return "tier3"
  }

  return COUNTRY_RISK_TIER[normalizedCountry] ?? "tier3"
}

function toNumber(value?: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(earthRadiusKm * c)
}

function readGeoInput(request: NextRequest | HeaderReader | GeoInput): GeoInput {
  if ("headers" in request && typeof request.headers.get === "function") {
    return {
      ipCountry: request.headers.get("x-vercel-ip-country"),
      ipCity: request.headers.get("x-vercel-ip-city"),
      ipLatitude: request.headers.get("x-vercel-ip-latitude"),
      ipLongitude: request.headers.get("x-vercel-ip-longitude"),
      realIp: request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for"),
    }
  }

  return request as GeoInput
}

export function enrichGeo(binCountry: string, request: NextRequest | HeaderReader | GeoInput): GeoContext {
  const normalizedBinCountry = normalizeCountry(binCountry)
  const input = readGeoInput(request)
  const ipCountry = normalizeCountry(input.ipCountry)
  const binCoords = normalizedBinCountry ? COUNTRY_COORDS[normalizedBinCountry] : undefined

  const latitude = toNumber(input.ipLatitude)
  const longitude = toNumber(input.ipLongitude)

  const distanceKm =
    latitude !== null && longitude !== null && binCoords
      ? haversineDistanceKm(binCoords.lat, binCoords.lng, latitude, longitude)
      : null

  return {
    ipCountry,
    ipCity: input.ipCity ?? null,
    ipCountryMatch: Boolean(ipCountry && normalizedBinCountry && ipCountry === normalizedBinCountry),
    distanceKm,
    ipCountryTier: getTier(ipCountry),
  }
}

export function getCountryRiskTier(country?: string | null): GeoContext["ipCountryTier"] {
  return getTier(country)
}

export { COUNTRY_RISK_TIER }
