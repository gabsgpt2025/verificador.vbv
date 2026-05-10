import { NextResponse } from "next/server"
import { z } from "zod"
import { getEnv } from "@/lib/env"
import { fetchGeocodeAddressDetailed } from "@/lib/premium-3-0/neutrino"

const schema = z.object({
  address: z.string().min(1),
  countryCode: z.string().min(2).max(2).optional(),
})

export async function POST(request: Request) {
  const env = getEnv()
  if (!env.NEUTRINO_GEOCODE_ADDRESS_ENABLED) {
    return NextResponse.json({ success: false, error: "Endpoint disabled" }, { status: 503 })
  }

  try {
    const body = schema.parse(await request.json())
    const response = await fetchGeocodeAddressDetailed({ address: body.address, countryCode: body.countryCode })
    return NextResponse.json({ success: true, data: response.data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

