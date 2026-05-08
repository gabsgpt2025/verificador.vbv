import { afterEach, describe, expect, it } from "vitest"
import { GET } from "@/app/api/admin/runtime-metrics/route"

describe("/api/admin/runtime-metrics", () => {
  afterEach(() => {
    delete process.env.ADMIN_METRICS_KEY
  })

  it("returns 503 when disabled", async () => {
    const response = await GET(new Request("http://localhost/api/admin/runtime-metrics"))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "metrics endpoint disabled" })
  })

  it("requires the admin header", async () => {
    process.env.ADMIN_METRICS_KEY = "secret"

    const response = await GET(new Request("http://localhost/api/admin/runtime-metrics"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" })
  })
})
