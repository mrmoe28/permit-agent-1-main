import { CacheConfig } from './types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 300000, maxSize: 100 }) { // 5 minutes default TTL
    this.config = config;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Get cache statistics
  getStats(): { size: number; hitRate: number; missRate: number } {
    this.cleanExpired();
    // This is a simplified version - in production you'd track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track this
      missRate: 0, // Would need to track this
    };
  }
}

// Global cache instances for different data types
export const jurisdictionCache = new InMemoryCache<any>({ ttl: 600000, maxSize: 50 }); // 10 minutes
export const urlValidationCache = new InMemoryCache<boolean>({ ttl: 300000, maxSize: 200 }); // 5 minutes
export const permitDataCache = new InMemoryCache<any>({ ttl: 1800000, maxSize: 100 }); // 30 minutes