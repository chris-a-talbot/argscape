/**
 * Structured error handling for inference endpoints.
 *
 * Parses backend structured errors and provides fallback pattern matching
 * for unexpected errors to display user-friendly messages.
 */

// Error codes matching backend (argscape/api/errors.py)
export const ErrorCode = {
  MISSING_SPATIAL_DATA: 'MISSING_SPATIAL_DATA',
  PACKAGE_UNAVAILABLE: 'PACKAGE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  SPARG_MULTIPLE_PARENTS: 'SPARG_MULTIPLE_PARENTS',
  SPARG_MULTIPLE_ROOTS: 'SPARG_MULTIPLE_ROOTS',
  SPACETREES_NO_COMMON_ANCESTOR: 'SPACETREES_NO_COMMON_ANCESTOR',
  TSDATE_INSUFFICIENT_MUTATIONS: 'TSDATE_INSUFFICIENT_MUTATIONS',
  TSDATE_ASSERTION_ERROR: 'TSDATE_ASSERTION_ERROR',
  NUMERICAL_ERROR: 'NUMERICAL_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// Structured error response from backend
interface StructuredError {
  error: {
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
  };
}

// Parsed error result for display
export interface ParsedInferenceError {
  title: string;
  message: string;
  isTimeout: boolean;
}

// Map error codes to user-friendly titles
const ERROR_TITLES: Record<string, string> = {
  [ErrorCode.MISSING_SPATIAL_DATA]: 'Missing Location Data',
  [ErrorCode.PACKAGE_UNAVAILABLE]: 'Package Not Available',
  [ErrorCode.TIMEOUT]: 'Inference Timeout',
  [ErrorCode.SPARG_MULTIPLE_PARENTS]: 'Incompatible Tree Structure',
  [ErrorCode.SPARG_MULTIPLE_ROOTS]: 'Incompatible Tree Structure',
  [ErrorCode.SPACETREES_NO_COMMON_ANCESTOR]: 'Incompatible Tree Structure',
  [ErrorCode.TSDATE_INSUFFICIENT_MUTATIONS]: 'Insufficient Data',
  [ErrorCode.TSDATE_ASSERTION_ERROR]: 'Internal Error',
  [ErrorCode.NUMERICAL_ERROR]: 'Calculation Error',
  [ErrorCode.MEMORY_ERROR]: 'Memory Error',
  [ErrorCode.FILE_NOT_FOUND]: 'File Not Found',
  [ErrorCode.UNKNOWN]: 'Error',
};

/**
 * Check if an object is a structured error response from the backend.
 */
function isStructuredError(obj: unknown): obj is StructuredError {
  if (typeof obj !== 'object' || obj === null) return false;
  const candidate = obj as Record<string, unknown>;
  if (typeof candidate.error !== 'object' || candidate.error === null) return false;
  const error = candidate.error as Record<string, unknown>;
  return typeof error.code === 'string' && typeof error.message === 'string';
}

/**
 * Extract error message from various error formats.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    // Check for axios/fetch error response patterns
    if (obj.response && typeof obj.response === 'object') {
      const response = obj.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        // Check for structured error in response
        if (isStructuredError(data)) {
          return data.error.message;
        }
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        if (typeof data.detail === 'object' && data.detail !== null) {
          // Structured error in detail
          if (isStructuredError({ error: data.detail })) {
            return (data.detail as StructuredError['error']).message;
          }
        }
        if (typeof data.message === 'string') {
          return data.message;
        }
      }
    }
    // Direct detail field
    if (typeof obj.detail === 'string') {
      return obj.detail;
    }
    if (typeof obj.message === 'string') {
      return obj.message;
    }
  }
  return String(error);
}

/**
 * Extract structured error from various error formats.
 */
function extractStructuredError(error: unknown): StructuredError | null {
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;

    // Direct structured error
    if (isStructuredError(obj)) {
      return obj;
    }

    // Axios/fetch response pattern
    if (obj.response && typeof obj.response === 'object') {
      const response = obj.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (isStructuredError(data)) {
          return data;
        }
        // Structured error nested in detail
        if (data.detail && typeof data.detail === 'object') {
          const detail = data.detail as Record<string, unknown>;
          if (detail.error && typeof detail.error === 'object') {
            const wrappedError = { error: detail.error };
            if (isStructuredError(wrappedError)) {
              return wrappedError as StructuredError;
            }
          }
        }
      }
    }

    // Detail contains structured error
    if (obj.detail && typeof obj.detail === 'object') {
      const detail = obj.detail as Record<string, unknown>;
      if (detail.error && typeof detail.error === 'object') {
        const wrappedError = { error: detail.error };
        if (isStructuredError(wrappedError)) {
          return wrappedError as StructuredError;
        }
      }
    }
  }
  return null;
}

/**
 * Fallback pattern matching for raw error strings.
 */
function categorizeRawError(message: string): { title: string; isTimeout: boolean } {
  const lowerMessage = message.toLowerCase();

  // Timeout detection
  if (/timed?\s*out|timeout|504/i.test(lowerMessage)) {
    return { title: 'Inference Timeout', isTimeout: true };
  }

  // Memory errors
  if (/memory|memoryerror/i.test(lowerMessage)) {
    return { title: 'Memory Error', isTimeout: false };
  }

  // Numerical errors
  if (/singular matrix|nan|infinity|division by zero|overflow|underflow|convergence/i.test(lowerMessage)) {
    return { title: 'Calculation Error', isTimeout: false };
  }

  // Missing spatial data
  if (/no sample locations|missing locations|location data/i.test(lowerMessage)) {
    return { title: 'Missing Location Data', isTimeout: false };
  }

  // Package unavailable
  if (/not available|not installed/i.test(lowerMessage)) {
    return { title: 'Package Not Available', isTimeout: false };
  }

  // SPARG specific
  if (/more than 2 parents/i.test(lowerMessage)) {
    return { title: 'Incompatible Tree Structure', isTimeout: false };
  }
  if (/multiple roots|single root/i.test(lowerMessage)) {
    return { title: 'Incompatible Tree Structure', isTimeout: false };
  }

  // Spacetrees specific
  if (/common ancestor/i.test(lowerMessage)) {
    return { title: 'Incompatible Tree Structure', isTimeout: false };
  }

  // Tsdate specific
  if (/mutations|insufficient/i.test(lowerMessage)) {
    return { title: 'Insufficient Data', isTimeout: false };
  }

  // Default
  return { title: 'Error', isTimeout: false };
}

/**
 * Parse an inference error and return user-friendly display information.
 *
 * Handles:
 * 1. Structured errors from the backend (preferred)
 * 2. Fallback pattern matching for raw error strings
 *
 * @param error - The caught error (can be Error, string, axios response, etc.)
 * @returns Parsed error with title, message, and timeout flag
 */
export function parseInferenceError(error: unknown): ParsedInferenceError {
  // Try to extract structured error first
  const structuredError = extractStructuredError(error);

  if (structuredError) {
    const { code, message, suggestion } = structuredError.error;
    const title = ERROR_TITLES[code] || 'Error';
    const isTimeout = code === ErrorCode.TIMEOUT;

    // Combine message and suggestion
    const fullMessage = suggestion
      ? `${message}\n\n${suggestion}`
      : message;

    return { title, message: fullMessage, isTimeout };
  }

  // Fallback to raw error parsing
  const rawMessage = extractErrorMessage(error);
  const { title, isTimeout } = categorizeRawError(rawMessage);

  return { title, message: rawMessage, isTimeout };
}

/**
 * Default timeout message for Railway deployments.
 */
export const TIMEOUT_MESSAGE =
  'Spatial inference took longer than 90 seconds and was cancelled. ' +
  'For larger ARGs, please install ARGscape locally via Python.';
