import { NetworkError } from './types';

export class EnhancedNetworkError extends Error implements NetworkError {
  public readonly code: string;
  public readonly isRetryable: boolean;
  public readonly statusCode?: number;
  public readonly response?: Response;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    isRetryable: boolean = false,
    statusCode?: number,
    response?: Response,
    originalError?: Error
  ) {
    super(message);
    this.name = 'EnhancedNetworkError';
    this.code = code;
    this.isRetryable = isRetryable;
    this.statusCode = statusCode;
    this.response = response;
    this.originalError = originalError;
  }
}

export function classifyNetworkError(error: Error): NetworkError {
  // AbortError from fetch timeout
  if (error.name === 'AbortError') {
    return new EnhancedNetworkError(
      'Request timed out',
      'TIMEOUT',
      true, // Timeouts are retryable
      undefined,
      undefined,
      error
    );
  }

  // Network connection errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return new EnhancedNetworkError(
      'Network connection failed',
      'CONNECTION_ERROR',
      true, // Connection errors are retryable
      undefined,
      undefined,
      error
    );
  }

  // DNS resolution errors
  if (error.message.includes('ENOTFOUND') || error.message.includes('ENOENT')) {
    return new EnhancedNetworkError(
      'DNS resolution failed',
      'DNS_ERROR',
      false, // DNS errors are usually not retryable
      undefined,
      undefined,
      error
    );
  }

  // Default to unknown error
  return new EnhancedNetworkError(
    error.message || 'Unknown network error',
    'UNKNOWN_ERROR',
    false,
    undefined,
    undefined,
    error
  );
}

export function createHttpError(response: Response): NetworkError {
  const isRetryable = isRetryableHttpStatus(response.status);
  
  return new EnhancedNetworkError(
    `HTTP ${response.status}: ${response.statusText}`,
    'HTTP_ERROR',
    isRetryable,
    response.status,
    response
  );
}

export function isRetryableHttpStatus(status: number): boolean {
  // Retry on server errors (5xx) and some client errors
  if (status >= 500) return true; // Server errors
  if (status === 408) return true; // Request Timeout
  if (status === 429) return true; // Too Many Requests
  if (status === 502) return true; // Bad Gateway
  if (status === 503) return true; // Service Unavailable
  if (status === 504) return true; // Gateway Timeout
  
  return false;
}

export function isRetryableError(error: Error | NetworkError): boolean {
  if ('isRetryable' in error) {
    return error.isRetryable;
  }
  
  // For standard errors, classify them first
  const networkError = classifyNetworkError(error);
  return networkError.isRetryable;
}