/**
 * Error handling types for the application
 * Provides type-safe error handling and consistent error messages
 */

/**
 * Base application error interface
 */
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * Type guard to check if error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AppError).message === 'string'
  );
};

/**
 * Supabase error structure
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Type guard for Supabase errors
 */
export const isSupabaseError = (error: unknown): error is SupabaseError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
};

/**
 * API error structure
 */
export interface ApiError {
  message: string;
  error?: string;
  success: boolean;
  statusCode?: number;
}

/**
 * Type guard for API errors
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'success' in error &&
    (error as ApiError).success === false
  );
};

/**
 * Extract error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) return error.message;
  if (isSupabaseError(error)) return error.message;
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Ocorreu um erro inesperado';
};

/**
 * Create a standardized error object
 */
export const createAppError = (
  message: string,
  options?: {
    code?: string;
    statusCode?: number;
    originalError?: unknown;
  }
): AppError => ({
  message,
  code: options?.code,
  statusCode: options?.statusCode,
  originalError: options?.originalError,
});
