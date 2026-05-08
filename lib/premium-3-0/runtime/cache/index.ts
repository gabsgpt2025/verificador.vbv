import { memoryCache } from "./memoryCache"
import { upstashCache } from "./upstashCache"
import type { CacheStats, CacheStore } from "./types"

type CacheBackendType = "memory" | "upstash"

type MutableCacheStats = {
  hits: number
  misses: number
  errors: number
}

const stats: MutableCacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
}

let selectedStore: CacheStore | null = null
let selectedType: CacheBackendType | null = null
let instrumentedStore: CacheStore | null = null

function resolveStore(): { store: CacheStore; type: CacheBackendType } {
  if (upstashCache) {
    return { store: upstashCache, type: "upstash" }
  }

  return { store: memoryCache, type: "memory" }
}

function ensureStore(): CacheStore {
  if (instrumentedStore && selectedType) {
    return instrumentedStore
  }

  const resolved = resolveStore()
  selectedStore = resolved.store
  selectedType = resolved.type
  instrumentedStore = {
    async get<T>(key: string): Promise<T | null> {
      try {
        const value = await selectedStore!.get<T>(key)
        if (value === null) {
          stats.misses += 1
        } else {
          stats.hits += 1
        }
        return value
      } catch (error) {
        stats.errors += 1
        throw error
      }
    },
    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      try {
        await selectedStore!.set(key, value, ttlSeconds)
      } catch (error) {
        stats.errors += 1
        throw error
      }
    },
    async delete(key: string): Promise<void> {
      try {
        await selectedStore!.delete(key)
      } catch (error) {
        stats.errors += 1
        throw error
      }
    },
    async has(key: string): Promise<boolean> {
      try {
        return await selectedStore!.has(key)
      } catch (error) {
        stats.errors += 1
        throw error
      }
    },
  }

  return instrumentedStore
}

export function getCache(): CacheStore {
  return ensureStore()
}

export function getCacheStats(): CacheStats {
  const lookups = stats.hits + stats.misses
  return {
    hits: stats.hits,
    misses: stats.misses,
    errors: stats.errors,
    hitRate: lookups === 0 ? 0 : stats.hits / lookups,
  }
}

export function getCacheType(): CacheBackendType {
  if (!selectedType) {
    const resolved = resolveStore()
    selectedType = resolved.type
  }

  return selectedType
}

export function resetCacheState() {
  stats.hits = 0
  stats.misses = 0
  stats.errors = 0
  instrumentedStore = null
  selectedStore = null
  selectedType = null
  memoryCache.clear()
}

export type { CacheStats, CacheStore } from "./types"
