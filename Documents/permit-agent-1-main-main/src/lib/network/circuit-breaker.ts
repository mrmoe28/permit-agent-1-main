import { CircuitBreakerConfig } from './types';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const currentTime = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (currentTime >= this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
        console.log('Circuit breaker transitioning to HALF_OPEN state');
      } else {
        throw new Error(`Circuit breaker is OPEN. Next attempt in ${this.nextAttemptTime - currentTime}ms`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    console.log('Circuit breaker reset to CLOSED state');
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in HALF_OPEN, go back to OPEN
      this.openCircuit();
    } else if (this.failureCount >= this.config.failureThreshold) {
      // If we exceed failure threshold, open the circuit
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    console.log(`Circuit breaker opened due to ${this.failureCount} failures. Will retry at ${new Date(this.nextAttemptTime)}`);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  // Manual circuit control
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    console.log('Circuit breaker manually reset');
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    console.log('Circuit breaker manually opened');
  }
}

// Global circuit breakers for different services
export const jurisdictionDiscoveryCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  resetTimeout: 60000,    // Try again after 1 minute
  monitoringPeriod: 10000, // Monitor over 10 seconds
});

export const webScrapingCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,     // Open after 3 failures
  resetTimeout: 30000,     // Try again after 30 seconds
  monitoringPeriod: 5000,  // Monitor over 5 seconds
});

export const aiProcessingCircuitBreaker = new CircuitBreaker({
  failureThreshold: 2,     // Open after 2 failures (AI is expensive)
  resetTimeout: 120000,    // Try again after 2 minutes
  monitoringPeriod: 30000, // Monitor over 30 seconds
});