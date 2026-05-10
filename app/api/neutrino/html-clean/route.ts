import { NextResponse } from "next/server"
import { z } from "zod"
import { getEnv } from "@/lib/env"
import { fetchHtmlCleanDetailed } from "@/lib/premium-3-0/neutrino"

const schema = z.object({
  content: z.string().min(1),
  outputType: z.enum(["plain-text", "simple-html"]).optional(),
})

export async function POST(request: Request) {
  const env = getEnv()
  if (!env.NEUTRINO_HTML_CLEAN_ENABLED) {
    return NextResponse.json({ success: false, error: "Endpoint disabled" }, { status: 503 })
  }

  try {
    const body = schema.parse(await request.json())
    const response = await fetchHtmlCleanDetailed({ content: body.content, outputType: body.outputType })
    return NextResponse.json({ success: true, data: response.data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}
