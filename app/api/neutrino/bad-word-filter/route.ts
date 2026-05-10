import { NextResponse } from "next/server"
import { z } from "zod"
import { getEnv } from "@/lib/env"
import { fetchBadWordFilterDetailed } from "@/lib/premium-3-0/neutrino"

const schema = z.object({
  content: z.string().min(1),
  censorCharacter: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  const env = getEnv()
  if (!env.NEUTRINO_BAD_WORD_FILTER_ENABLED) {
    return NextResponse.json({ success: false, error: "Endpoint disabled" }, { status: 503 })
  }

  try {
    const body = schema.parse(await request.json())
    const response = await fetchBadWordFilterDetailed({ content: body.content, censorCharacter: body.censorCharacter })
    return NextResponse.json({ success: true, data: response.data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

