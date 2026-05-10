import { NextResponse } from "next/server"
import { z } from "zod"
import { getEnv } from "@/lib/env"
import { fetchQrCodeDetailed } from "@/lib/premium-3-0/neutrino"

const schema = z.object({
  content: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export async function POST(request: Request) {
  const env = getEnv()
  if (!env.NEUTRINO_QR_CODE_ENABLED) {
    return NextResponse.json({ success: false, error: "Endpoint disabled" }, { status: 503 })
  }

  try {
    const body = schema.parse(await request.json())
    const response = await fetchQrCodeDetailed({ content: body.content, width: body.width, height: body.height })
    return new Response(response.data, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 })
  }
}

