import { ScrapingResult } from './scraper';
import { ParsedGovernmentContent } from './ai-parser';

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  quality: number;
}

interface ScrapingCacheEntry extends CacheEntry<ScrapingResult> {
  url: string;
  checksum?: string;
}

interface AIParsingCacheEntry extends CacheEntry<ParsedGovernmentContent> {
  url: string;
  contentHash: string;
}

export class DataCache {
  private scrapingCache = new Map<string, ScrapingCacheEntry>();
  private aiParsingCache = new Map<string, AIParsingCacheEntry>();
  private maxSize = 1000; // Maximum cache entries
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Cache scraping results with quality-based expiration
   */
  cacheScrapingResult(url: string, result: ScrapingResult, quality = 0.5): void {
    // Calculate TTL based on data quality and site type
    let ttl = this.defaultTTL;
    
    if (this.isGovernmentSite(url)) {
      // Government sites change less frequently
      ttl = quality > 0.8 ? 7 * 24 * 60 * 60 * 1000 : // 7 days for high quality
            quality > 0.5 ? 3 * 24 * 60 * 60 * 1000 : // 3 days for medium quality
            24 * 60 * 60 * 1000; // 1 day for low quality
    }

    const entry: ScrapingCacheEntry = {
      url,
      data: result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      quality,
      checksum: this.generateChecksum(result)
    };

    this.scrapingCache.set(url, entry);
    this.cleanup();
    
    console.log(`Cached scraping result for ${url} (quality: ${quality.toFixed(2)}, TTL: ${Math.round(ttl / (60 * 60 * 1000))}h)`);
  }

  /**
   * Get cached scraping result if valid
   */
  getCachedScrapingResult(url: string): ScrapingResult | null {
    const entry = this.scrapingCache.get(url);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.scrapingCache.delete(url);
      console.log(`Expired cache entry removed for ${url}`);
      return null;
    }

    console.log(`Cache hit for ${url} (quality: ${entry.quality.toFixed(2)})`);
    return entry.data;
  }

  /**
   * Cache AI parsing results
   */
  cacheAIParsingResult(url: string, contentHash: string, result: ParsedGovernmentContent): void {
    const ttl = result.dataQuality > 0.8 ? 7 * 24 * 60 * 60 * 1000 : // 7 days for high quality AI results
               result.dataQuality > 0.5 ? 3 * 24 * 60 * 60 * 1000 : // 3 days for medium quality
               24 * 60 * 60 * 1000; // 1 day for low quality

    const entry: AIParsingCacheEntry = {
      url,
      contentHash,
      data: result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      quality: result.dataQuality
    };

    const cacheKey = this.getAICacheKey(url, contentHash);
    this.aiParsingCache.set(cacheKey, entry);
    
    console.log(`Cached AI parsing result for ${url} (quality: ${result.dataQuality.toFixed(2)})`);
  }

  /**
   * Get cached AI parsing result if content hasn't changed
   */
  getCachedAIParsingResult(url: string, contentHash: string): ParsedGovernmentContent | null {
    const cacheKey = this.getAICacheKey(url, contentHash);
    const entry = this.aiParsingCache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.aiParsingCache.delete(cacheKey);
      return null;
    }

    // Check if content hash matches (content hasn't changed)
    if (entry.contentHash !== contentHash) {
      this.aiParsingCache.delete(cacheKey);
      return null;
    }

    console.log(`AI parsing cache hit for ${url}`);
    return entry.data;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = new Date();
    
    const scrapingStats = {
      total: this.scrapingCache.size,
      expired: Array.from(this.scrapingCache.values()).filter(entry => now > entry.expiresAt).length,
      highQuality: Array.from(this.scrapingCache.values()).filter(entry => entry.quality > 0.8).length
    };

    const aiStats = {
      total: this.aiParsingCache.size,
      expired: Array.from(this.aiParsingCache.values()).filter(entry => now > entry.expiresAt).length,
      highQuality: Array.from(this.aiParsingCache.values()).filter(entry => entry.quality > 0.8).length
    };

    return {
      scraping: scrapingStats,
      aiParsing: aiStats,
      totalMemory: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): number {
    const now = new Date();
    let cleared = 0;

    // Clear expired scraping results
    for (const [key, entry] of this.scrapingCache.entries()) {
      if (now > entry.expiresAt) {
        this.scrapingCache.delete(key);
        cleared++;
      }
    }

    // Clear expired AI parsing results
    for (const [key, entry] of this.aiParsingCache.entries()) {
      if (now > entry.expiresAt) {
        this.aiParsingCache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    const total = this.scrapingCache.size + this.aiParsingCache.size;
    this.scrapingCache.clear();
    this.aiParsingCache.clear();
    console.log(`Cleared all ${total} cache entries`);
  }

  private getAICacheKey(url: string, contentHash: string): string {
    return `ai:${url}:${contentHash}`;
  }

  private generateChecksum(result: ScrapingResult): string {
    // Simple checksum based on key content
    const content = `${result.title}${result.content.substring(0, 1000)}${result.links.length}`;
    return this.simpleHash(content);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private isGovernmentSite(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.endsWith('.gov') || 
             hostname.endsWith('.us') ||
             hostname.includes('city') ||
             hostname.includes('county') ||
             hostname.includes('municipal');
    } catch {
      return false;
    }
  }

  private cleanup(): void {
    // Remove expired entries first
    this.clearExpired();

    // If still over limit, remove oldest entries
    if (this.scrapingCache.size > this.maxSize) {
      const entries = Array.from(this.scrapingCache.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = entries.slice(0, entries.length - this.maxSize);
      for (const [key] of toRemove) {
        this.scrapingCache.delete(key);
      }
    }
  }

  private estimateMemoryUsage(): string {
    let totalSize = 0;
    
    // Estimate scraping cache size
    for (const entry of this.scrapingCache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    
    // Estimate AI parsing cache size  
    for (const entry of this.aiParsingCache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    
    // Convert to human readable format
    if (totalSize < 1024) return `${totalSize} bytes`;
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
    return `${Math.round(totalSize / (1024 * 1024))} MB`;
  }
}

// Global cache instance
export const dataCache = new DataCache();

// Auto-cleanup every hour
setInterval(() => {
  dataCache.clearExpired();
}, 60 * 60 * 1000);