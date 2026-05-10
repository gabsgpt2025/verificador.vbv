import { NextResponse } from "next/server"
import { z } from "zod"
import { getEnv } from "@/lib/env"
import { fetchUrlInfoDetailed } from "@/lib/premium-3-0/neutrino"

const schema = z.object({
  url: z.string().url(),
})

export async function POST(request: Request) {
  const env = getEnv()
  if (!env.NEUTRINO_URL_INFO_ENABLED) {
    return NextResponse.json({ success: false, error: "Endpoint disabled" }, { status: 503 })
  }

  try {
    const body = schema.parse(await request.json())
    const response = await fetchUrlInfoDetailed({ url: body.url })
    return NextResponse.json({ success: true, data: response.data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

