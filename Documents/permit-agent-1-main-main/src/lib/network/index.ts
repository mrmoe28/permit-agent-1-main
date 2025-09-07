// Network utilities barrel export

// Types
export * from './types';

// Error handling
export * from './errors';

// Retry logic
export * from './retry';

// Caching
export * from './cache';

// Rate limiting
export * from './rate-limiter';

// Circuit breaker
export * from './circuit-breaker';

// HTTP client
export * from './http-client';

// Utility functions
export function isValidHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove potential XSS and ensure HTTPS for external requests
    if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
      urlObj.protocol = 'https:';
    }
    return urlObj.href;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = new URL(url1).hostname;
    const domain2 = new URL(url2).hostname;
    return domain1 === domain2;
  } catch {
    return false;
  }
}

export function buildUrlWithParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.href;
}

export function getTimeoutForUrlType(url: string): number {
  const domain = extractDomainFromUrl(url);
  const isVercel = process.env.VERCEL === '1';
  
  // Government sites get optimized timeouts for Vercel
  if (domain.endsWith('.gov') || domain.includes('government')) {
    return isVercel ? 10000 : 20000; // Shorter on Vercel
  }
  
  // API endpoints get standard timeout
  if (url.includes('/api/')) {
    return isVercel ? 15000 : 30000; // Shorter on Vercel
  }
  
  // Default timeout
  return isVercel ? 8000 : 15000; // Much shorter on Vercel
}