import { RateLimitConfig } from './types';

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Clean old requests (older than 1 minute)
    this.requests = this.requests.filter(timestamp => now - timestamp < 60000);
    
    // Check if we can make a request
    if (this.canMakeRequest()) {
      this.requests.push(now);
      return;
    }
    
    // Calculate wait time
    const waitTime = this.calculateWaitTime();
    
    if (waitTime > 0) {
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursive call after waiting
    }
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check requests per second
    const recentRequests = this.requests.filter(timestamp => now - timestamp < 1000);
    if (recentRequests.length >= this.config.requestsPerSecond) {
      return false;
    }
    
    // Check requests per minute
    const minuteRequests = this.requests.filter(timestamp => now - timestamp < 60000);
    if (minuteRequests.length >= this.config.requestsPerMinute) {
      return false;
    }
    
    return true;
  }

  private calculateWaitTime(): number {
    const now = Date.now();
    
    // Calculate wait time based on requests per second
    const recentRequests = this.requests.filter(timestamp => now - timestamp < 1000);
    if (recentRequests.length >= this.config.requestsPerSecond) {
      const oldestRecent = Math.min(...recentRequests);
      const secondWaitTime = 1000 - (now - oldestRecent) + 10; // Add 10ms buffer
      return Math.max(0, secondWaitTime);
    }
    
    // Calculate wait time based on requests per minute
    const minuteRequests = this.requests.filter(timestamp => now - timestamp < 60000);
    if (minuteRequests.length >= this.config.requestsPerMinute) {
      const oldestMinute = Math.min(...minuteRequests);
      const minuteWaitTime = 60000 - (now - oldestMinute) + 100; // Add 100ms buffer
      return Math.max(0, minuteWaitTime);
    }
    
    return 0;
  }

  getStats(): { requestsInLastSecond: number; requestsInLastMinute: number } {
    const now = Date.now();
    return {
      requestsInLastSecond: this.requests.filter(timestamp => now - timestamp < 1000).length,
      requestsInLastMinute: this.requests.filter(timestamp => now - timestamp < 60000).length,
    };
  }
}

// Global rate limiter for government websites
export const governmentSiteRateLimiter = new RateLimiter({
  requestsPerSecond: 1,    // Conservative: 1 request per second
  requestsPerMinute: 30,   // Conservative: 30 requests per minute
  burstSize: 3,           // Allow small bursts
});

// Rate limiter for API calls
export const apiRateLimiter = new RateLimiter({
  requestsPerSecond: 5,    // More aggressive for APIs
  requestsPerMinute: 100,  // Higher limit for APIs
  burstSize: 10,
});