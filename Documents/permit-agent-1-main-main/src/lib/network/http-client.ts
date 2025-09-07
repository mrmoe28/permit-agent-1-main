import { RequestConfig, NetworkMetrics } from './types';
import { classifyNetworkError, createHttpError } from './errors';
import { retryWithBackoff } from './retry';
import { generateId } from '@/lib/utils';

export class EnhancedHttpClient {
  private defaultConfig: RequestConfig;

  constructor(defaultConfig: Partial<RequestConfig> = {}) {
    // Optimize for Vercel deployment
    const isVercel = process.env.VERCEL === '1';
    
    this.defaultConfig = {
      timeout: isVercel ? 15000 : 30000, // Shorter timeout on Vercel
      retries: isVercel ? 2 : 3, // Fewer retries on Vercel
      backoffFactor: 1.5, // Smaller backoff factor
      retryDelay: 500, // Faster initial retry
      maxRetryDelay: isVercel ? 10000 : 30000, // Shorter max delay on Vercel
      userAgent: 'PermitAgent/1.0 (+https://permitagent.com)',
      headers: {},
      ...defaultConfig,
    };
  }

  async fetch(url: string, options: RequestInit & RequestConfig = {}): Promise<Response> {
    const config = { ...this.defaultConfig, ...options };
    const requestId = generateId();
    
    const metrics: NetworkMetrics = {
      requestId,
      url,
      method: options.method || 'GET',
      startTime: Date.now(),
      success: false,
      retryCount: 0,
    };

    console.log(`[${requestId}] Starting request to ${url}`);

    try {
      const response = await retryWithBackoff(
        async () => {
          metrics.retryCount++;
          return await this.performRequest(url, config);
        },
        {
          maxRetries: config.retries!,
          baseDelay: config.retryDelay!,
          maxDelay: config.maxRetryDelay!,
          backoffFactor: config.backoffFactor!,
          jitter: true,
        }
      );

      metrics.endTime = Date.now();
      metrics.success = true;
      metrics.statusCode = response.status;
      
      this.logMetrics(metrics);
      return response;

    } catch (error) {
      metrics.endTime = Date.now();
      metrics.success = false;
      
      const networkError = classifyNetworkError(error as Error);
      metrics.errorType = networkError.code as any;
      
      this.logMetrics(metrics);
      throw networkError;
    }
  }

  private async performRequest(url: string, config: RequestConfig): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const headers: Record<string, string> = {
        'User-Agent': config.userAgent!,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        ...config.headers,
      };

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        throw createHttpError(response);
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Convenience methods
  async get(url: string, config?: RequestConfig): Promise<Response> {
    return this.fetch(url, { ...config, method: 'GET' });
  }

  async post(url: string, body?: any, config?: RequestConfig): Promise<Response> {
    return this.fetch(url, {
      ...config,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  async head(url: string, config?: RequestConfig): Promise<Response> {
    return this.fetch(url, {
      ...config,
      method: 'HEAD',
      timeout: 10000, // Shorter timeout for HEAD requests
    });
  }

  private logMetrics(metrics: NetworkMetrics): void {
    const duration = metrics.endTime ? metrics.endTime - metrics.startTime : 0;
    const status = metrics.success ? 'SUCCESS' : 'FAILED';
    
    console.log(
      `[${metrics.requestId}] ${status} ${metrics.method} ${metrics.url} ` +
      `${duration}ms (${metrics.retryCount} attempts) ` +
      `${metrics.statusCode ? `HTTP ${metrics.statusCode}` : ''} ` +
      `${metrics.errorType ? `Error: ${metrics.errorType}` : ''}`
    );
  }
}

// Global HTTP client instances
export const httpClient = new EnhancedHttpClient();

export const governmentHttpClient = new EnhancedHttpClient({
  timeout: process.env.VERCEL === '1' ? 8000 : 15000, // Even shorter on Vercel
  retries: process.env.VERCEL === '1' ? 1 : 2, // Minimal retries on Vercel
  userAgent: 'PermitAgent/1.0 (Municipal Permit Research Tool)',
});

export const apiHttpClient = new EnhancedHttpClient({
  timeout: 30000, // Standard timeout for APIs
  retries: 3,     // Standard retries
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});