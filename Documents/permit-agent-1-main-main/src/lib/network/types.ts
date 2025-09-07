// Network utility types and interfaces

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  backoffFactor?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface NetworkError extends Error {
  code: string;
  isRetryable: boolean;
  statusCode?: number;
  response?: Response;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstSize: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export type NetworkErrorType = 
  | 'TIMEOUT'
  | 'CONNECTION_ERROR'
  | 'DNS_ERROR'
  | 'HTTP_ERROR'
  | 'ABORT_ERROR'
  | 'UNKNOWN_ERROR';

export interface NetworkMetrics {
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  errorType?: NetworkErrorType;
  statusCode?: number;
  retryCount: number;
}