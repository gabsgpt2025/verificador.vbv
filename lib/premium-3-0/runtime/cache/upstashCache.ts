import type { CacheStore } from "./types"

export class UpstashCacheStore implements CacheStore {
  constructor(
    private readonly redis: {
      get<T>(key: string): Promise<T | null>
      set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>
      del(key: string): Promise<unknown>
      exists(key: string): Promise<number>
    },
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key)
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, { ex: ttlSeconds })
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) > 0
  }
}

function createUpstashCache(): CacheStore | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  // install when enabling: @upstash/redis
  return null
}

export const upstashCache = createUpstashCache()
