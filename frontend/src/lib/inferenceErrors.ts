/**
 * Error handling for inference endpoints.
 *
 * Simple approach: extract plain string error messages from backend responses.
 */

// Parsed error result for display
export interface ParsedInferenceError {
  title: string;
  message: string;
  isTimeout: boolean;
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
        // FastAPI returns { detail: "message" } for HTTPException with string detail
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        if (typeof data.message === 'string') {
          return data.message;
        }
      }
    }

    // Direct detail field (for direct error objects)
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
 * Detect timeout from error message.
 */
function isTimeoutError(message: string): boolean {
  return /timed?\s*out|timeout|504/i.test(message.toLowerCase());
}

/**
 * Parse an inference error and return user-friendly display information.
 *
 * @param error - The caught error (can be Error, string, axios response, etc.)
 * @returns Parsed error with title, message, and timeout flag
 */
export function parseInferenceError(error: unknown): ParsedInferenceError {
  const message = extractErrorMessage(error);
  const isTimeout = isTimeoutError(message);

  return {
    title: isTimeout ? 'Inference Timeout' : 'Inference Error',
    message,
    isTimeout
  };
}

/**
 * Default timeout message for Railway deployments.
 */
export const TIMEOUT_MESSAGE =
  'Inference timed out. For larger tree sequences, install ARGscape locally where there are no time limits.';
