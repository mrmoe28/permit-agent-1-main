import { toast } from '@/hooks/use-toast';

export interface ErrorResponse {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class APIError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    return new APIError(error.message, 500, 'UNKNOWN_ERROR', error);
  }

  if (typeof error === 'string') {
    return new APIError(error, 500, 'STRING_ERROR');
  }

  return new APIError('An unknown error occurred', 500, 'UNKNOWN_ERROR', error);
}

export function showErrorToast(error: unknown, customMessage?: string) {
  const apiError = handleAPIError(error);
  
  toast({
    title: 'Error',
    description: customMessage || apiError.message,
    variant: 'destructive',
  });

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', apiError);
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    showErrorToast(error, errorMessage);
    return null;
  }
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault(); // Prevent the default browser behavior
      showErrorToast(event.reason, 'An unexpected error occurred');
    }
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    if (process.env.NODE_ENV === 'production') {
      showErrorToast(event.error, 'An unexpected error occurred');
    }
  });
}
