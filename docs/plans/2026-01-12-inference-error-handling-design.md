# Inference Error Handling Design

## Overview

Improve error handling for spatial and temporal inference methods to provide users with informative, actionable error messages instead of raw exception strings.

## Approach

**Both backend and frontend** handle errors:
- Backend categorizes known error patterns and returns structured responses
- Frontend parses structured errors and has fallback pattern matching for unexpected errors

## Error Response Structure

Backend returns structured error responses:

```json
{
  "error": {
    "code": "SPARG_MULTIPLE_ROOTS",
    "message": "SPARG requires your tree sequence to have a single root per tree.",
    "details": "Tree at position 0 has 3 roots",
    "suggestion": "Try using FastGAIA or Midpoint inference instead, which handle multiple roots."
  }
}
```

## Error Categories

| Code | Pattern to Match | User Message | Suggestion |
|------|------------------|--------------|------------|
| `MISSING_SPATIAL_DATA` | "No sample locations" | "Your tree sequence doesn't have location data for samples." | "Upload a CSV with coordinates or use a file that includes spatial data." |
| `PACKAGE_UNAVAILABLE` | "not available" | "{Method} requires the {package} package which isn't installed." | "Install with `pip install {package}` or try a different method." |
| `TIMEOUT` | asyncio.TimeoutError | "Inference timed out after {n} seconds." | "For larger ARGs, install ARGscape locally." |
| `SPARG_MULTIPLE_PARENTS` | "more than 2 parents" | "This ARG has nodes with more than 2 parents." | "Try FastGAIA or Midpoint instead." |
| `SPARG_MULTIPLE_ROOTS` | "multiple roots" / "single root" | "SPARG requires trees with a single root." | "Try FastGAIA or Midpoint instead." |
| `SPACETREES_NO_COMMON_ANCESTOR` | "No trees found where all samples share" | "No trees have a common ancestor for all samples." | "Try a different inference method or check your tree sequence structure." |
| `TSDATE_INSUFFICIENT_MUTATIONS` | "requires at least X mutations" | "Tsdate needs at least {n} mutations to infer times." | "Your tree sequence has too few mutations for reliable dating." |
| `TSDATE_ASSERTION_ERROR` | AssertionError from tsdate | "Tsdate encountered an internal error (known issue)." | "Try with different parameters or a simplified tree sequence." |
| `NUMERICAL_ERROR` | "singular matrix", "NaN", "Inf", ZeroDivisionError | "The calculation encountered numerical issues." | "Try simplifying your tree sequence or using different parameters." |
| `MEMORY_ERROR` | MemoryError | "Not enough memory to process this tree sequence." | "Try simplifying or use a machine with more RAM." |
| `UNKNOWN` | Catch-all | "An unexpected error occurred: {original message}" | "Please report this issue if it persists." |

## Files Changed

### New Files
- `argscape/api/errors.py` - Error classes, codes, and pattern matching logic
- `frontend/src/lib/inferenceErrors.ts` - Error parsing and fallback handling

### Modified Files
- `argscape/api/routes/inference.py` - Use structured error responses
- `frontend/src/components/pages/ResultPage.tsx` - Use parseInferenceError()

## Implementation

### Backend (`argscape/api/errors.py`)

```python
class InferenceError:
    code: str
    message: str
    details: str | None
    suggestion: str | None
    status_code: int

def categorize_inference_error(exception: Exception, method: str) -> InferenceError:
    # Pattern match against known errors and return structured response
```

### Frontend (`frontend/src/lib/inferenceErrors.ts`)

```typescript
interface InferenceErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
  }
}

function parseInferenceError(error: unknown): { title: string; message: string }
```
