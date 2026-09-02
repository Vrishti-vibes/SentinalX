interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get an item from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set an item in cache with a TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }
}

// Global instance (persists in Node.js runtime process)
export const memoryCache = new SimpleMemoryCache();
