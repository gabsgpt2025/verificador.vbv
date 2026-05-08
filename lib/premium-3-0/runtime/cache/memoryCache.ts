import type { CacheStore } from "./types"

const DEFAULT_MAX_ENTRIES = 1_000
const DEFAULT_CLEANUP_INTERVAL_MS = 60_000

type MemoryEntry = {
  value: unknown
  expiresAt: number
}

export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, MemoryEntry>()
  private readonly cleanupTimer: ReturnType<typeof setInterval>

  constructor(
    private readonly maxEntries = DEFAULT_MAX_ENTRIES,
    cleanupIntervalMs = DEFAULT_CLEANUP_INTERVAL_MS,
  ) {
    this.cleanupTimer = setInterval(() => {
      this.evictExpiredEntries()
    }, cleanupIntervalMs)

    this.cleanupTimer.unref?.()
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key)
    if (!entry) {
      return null
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key)
      return null
    }

    this.touch(key, entry)
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      this.entries.delete(key)
      return
    }

    this.entries.delete(key)
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    })

    this.evictExpiredEntries()
    this.evictOverflow()
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key)
  }

  async has(key: string): Promise<boolean> {
    const entry = this.entries.get(key)
    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key)
      return false
    }

    return true
  }

  clear() {
    this.entries.clear()
  }

  dispose() {
    clearInterval(this.cleanupTimer)
  }

  private isExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt <= Date.now()
  }

  private evictExpiredEntries() {
    for (const [key, entry] of this.entries.entries()) {
      if (this.isExpired(entry)) {
        this.entries.delete(key)
      }
    }
  }

  private evictOverflow() {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value
      if (!oldestKey) {
        return
      }

      this.entries.delete(oldestKey)
    }
  }

  private touch(key: string, entry: MemoryEntry) {
    this.entries.delete(key)
    this.entries.set(key, entry)
  }
}

export const memoryCache = new MemoryCacheStore()
