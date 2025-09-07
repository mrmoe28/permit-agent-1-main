import { RetryConfig } from './types';
import { isRetryableError } from './errors';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
};

export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  const delayWithCap = Math.min(exponentialDelay, config.maxDelay);
  
  if (!config.jitter) {
    return delayWithCap;
  }
  
  // Add jitter to prevent thundering herd
  const jitterRange = delayWithCap * 0.1; // 10% jitter
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;
  
  return Math.max(0, delayWithCap + jitter);
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt > config.maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }
      
      const delay = calculateRetryDelay(attempt, config);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export class RetryableFunction<T> {
  private config: RetryConfig;
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }
  
  async execute(operation: () => Promise<T>): Promise<T> {
    return retryWithBackoff(operation, this.config);
  }
  
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}