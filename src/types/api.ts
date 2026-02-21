/**
 * API response types
 * Defines standard response structures for API calls
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * N8N webhook response
 */
export interface N8nResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Type guard for API response
 */
export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as ApiResponse<T>).success === 'boolean'
  );
};
