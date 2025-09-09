/**
 * Error Handling Utilities
 * 
 * This module provides centralized error handling utilities for the ALX Polly app.
 * It includes error logging, user-friendly error messages, and consistent error handling patterns.
 */

import { ApiResponse } from '@/lib/types';

/**
 * Error Types
 * 
 * Defines different types of errors that can occur in the application.
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Application Error Class
 * 
 * Custom error class that includes error type and user-friendly messages.
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    userMessage?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.userMessage = userMessage || message;
    this.originalError = originalError;
  }
}

/**
 * Error Logger
 * 
 * Centralized logging utility for errors with different levels.
 */
export class ErrorLogger {
  /**
   * Log error with context information
   * 
   * @param error - Error to log
   * @param context - Additional context information
   * @param level - Log level (error, warn, info)
   */
  static log(
    error: Error | AppError,
    context?: Record<string, any>,
    level: 'error' | 'warn' | 'info' = 'error'
  ): void {
    const logData = {
      message: error.message,
      type: error instanceof AppError ? error.type : ErrorType.UNKNOWN,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    if (level === 'error') {
      console.error('Application Error:', logData);
    } else if (level === 'warn') {
      console.warn('Application Warning:', logData);
    } else {
      console.info('Application Info:', logData);
    }

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * Log API errors with response details
   * 
   * @param error - API error
   * @param endpoint - API endpoint that failed
   * @param requestData - Request data that was sent
   */
  static logApiError(
    error: Error,
    endpoint: string,
    requestData?: Record<string, any>
  ): void {
    this.log(error, {
      endpoint,
      requestData,
      errorType: 'API_ERROR'
    });
  }
}

/**
 * Error Message Generator
 * 
 * Generates user-friendly error messages based on error types.
 */
export class ErrorMessageGenerator {
  /**
   * Get user-friendly error message
   * 
   * @param error - Error to generate message for
   * @returns User-friendly error message
   */
  static getUserMessage(error: Error | AppError): string {
    if (error instanceof AppError) {
      return error.userMessage;
    }

    // Handle common error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'You are not authorized to perform this action. Please sign in.';
    }

    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (error.message.includes('validation') || error.message.includes('400')) {
      return 'Please check your input and try again.';
    }

    if (error.message.includes('server') || error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error message for specific error types
   * 
   * @param type - Error type
   * @param context - Additional context
   * @returns User-friendly error message
   */
  static getMessageByType(type: ErrorType, context?: Record<string, any>): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue.';
      
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      
      case ErrorType.VALIDATION:
        return context?.field 
          ? `Please check the ${context.field} field and try again.`
          : 'Please check your input and try again.';
      
      case ErrorType.NOT_FOUND:
        return context?.resource 
          ? `${context.resource} not found.`
          : 'The requested resource was not found.';
      
      case ErrorType.SERVER:
        return 'Server error. Please try again later.';
      
      case ErrorType.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Error Handler
 * 
 * Centralized error handling utility that processes errors and returns appropriate responses.
 */
export class ErrorHandler {
  /**
   * Handle API errors and return standardized response
   * 
   * @param error - Error to handle
   * @param context - Additional context
   * @returns Standardized API response
   */
  static handleApiError(
    error: Error | AppError,
    context?: Record<string, any>
  ): ApiResponse {
    ErrorLogger.log(error, context);

    const userMessage = ErrorMessageGenerator.getUserMessage(error);
    
    return {
      success: false,
      error: userMessage
    };
  }

  /**
   * Handle validation errors
   * 
   * @param errors - Validation errors
   * @returns Standardized API response
   */
  static handleValidationError(errors: Record<string, string>): ApiResponse {
    const firstError = Object.values(errors)[0];
    
    return {
      success: false,
      error: firstError || 'Validation failed'
    };
  }

  /**
   * Handle authentication errors
   * 
   * @param error - Authentication error
   * @returns Standardized API response
   */
  static handleAuthError(error: Error): ApiResponse {
    return this.handleApiError(
      new AppError(
        error.message,
        ErrorType.AUTHENTICATION,
        'Please sign in to continue.'
      )
    );
  }

  /**
   * Handle authorization errors
   * 
   * @param error - Authorization error
   * @returns Standardized API response
   */
  static handleAuthorizationError(error: Error): ApiResponse {
    return this.handleApiError(
      new AppError(
        error.message,
        ErrorType.AUTHORIZATION,
        'You do not have permission to perform this action.'
      )
    );
  }

  /**
   * Handle not found errors
   * 
   * @param resource - Resource that was not found
   * @returns Standardized API response
   */
  static handleNotFoundError(resource: string): ApiResponse {
    return this.handleApiError(
      new AppError(
        `${resource} not found`,
        ErrorType.NOT_FOUND,
        `${resource} not found.`
      )
    );
  }
}

/**
 * Error Boundary Props
 * 
 * Props for error boundary components.
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary State
 * 
 * State for error boundary components.
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Utility Functions
 */

/**
 * Check if error is a network error
 * 
 * @param error - Error to check
 * @returns True if it's a network error
 */
export function isNetworkError(error: Error): boolean {
  return error.message.includes('network') || 
         error.message.includes('fetch') ||
         error.message.includes('timeout');
}

/**
 * Check if error is an authentication error
 * 
 * @param error - Error to check
 * @returns True if it's an authentication error
 */
export function isAuthError(error: Error): boolean {
  return error.message.includes('unauthorized') ||
         error.message.includes('401') ||
         error.message.includes('authentication');
}

/**
 * Check if error is a validation error
 * 
 * @param error - Error to check
 * @returns True if it's a validation error
 */
export function isValidationError(error: Error): boolean {
  return error.message.includes('validation') ||
         error.message.includes('400') ||
         error.message.includes('invalid');
}

/**
 * Retry utility for failed operations
 * 
 * @param operation - Operation to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in milliseconds
 * @returns Promise that resolves with operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry certain types of errors
      if (isAuthError(error as Error) || isValidationError(error as Error)) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

/**
 * Safe async operation wrapper
 * 
 * Wraps an async operation with error handling and returns a standardized result.
 * 
 * @param operation - Async operation to wrap
 * @param context - Additional context for error logging
 * @returns Promise resolving to standardized result
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      (error as Error).message,
      ErrorType.UNKNOWN,
      undefined,
      error as Error
    );
    
    ErrorLogger.log(appError, context);
    
    return {
      success: false,
      error: ErrorMessageGenerator.getUserMessage(appError)
    };
  }
}
