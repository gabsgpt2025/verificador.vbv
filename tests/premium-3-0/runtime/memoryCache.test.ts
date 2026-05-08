import { afterEach, describe, expect, it, vi } from "vitest"
import { MemoryCacheStore } from "@/lib/premium-3-0/runtime/cache/memoryCache"

describe("MemoryCacheStore", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("stores and retrieves values", async () => {
    const cache = new MemoryCacheStore()

    await cache.set("bin:1", { brand: "VISA" }, 60)

    await expect(cache.get<{ brand: string }>("bin:1")).resolves.toEqual({ brand: "VISA" })
    await expect(cache.has("bin:1")).resolves.toBe(true)

    cache.dispose()
  })

  it("expires entries after ttl", async () => {
    vi.useFakeTimers()
    const cache = new MemoryCacheStore(10, 50)

    await cache.set("bin:expire", { brand: "MC" }, 1)
    vi.advanceTimersByTime(1_001)

    await expect(cache.get("bin:expire")).resolves.toBeNull()
    await expect(cache.has("bin:expire")).resolves.toBe(false)

    cache.dispose()
  })

  it("evicts the least recently used entry when full", async () => {
    const cache = new MemoryCacheStore(2)

    await cache.set("a", 1, 60)
    await cache.set("b", 2, 60)
    await cache.get("a")
    await cache.set("c", 3, 60)

    await expect(cache.get("a")).resolves.toBe(1)
    await expect(cache.get("b")).resolves.toBeNull()
    await expect(cache.get("c")).resolves.toBe(3)

    cache.dispose()
  })
})
