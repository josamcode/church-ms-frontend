/**
 * Map a backend AI error code onto a translation key.
 *
 * A generic "something went wrong" is useless for these failures: "you are out
 * of quota today", "remove the phone number from your points", and "the
 * provider is down" call for three completely different user responses, and
 * only one of them is worth retrying.
 *
 * Shared by every AI surface so the same failure never reads differently in
 * two places.
 */

const ERROR_KEY_BY_CODE = Object.freeze({
  AI_DISABLED: 'ai.errors.disabled',
  AI_UNAVAILABLE: 'ai.errors.unavailable',
  AI_QUOTA_EXCEEDED: 'ai.errors.quota',
  RATE_LIMITED: 'ai.errors.rateLimited',
  AI_INPUT_BLOCKED: 'ai.errors.blocked',
  AI_OUTPUT_INVALID: 'ai.errors.invalidOutput',
  AI_INSUFFICIENT_DATA: 'ai.analytics.empty',
});

const FALLBACK_KEY = 'ai.errors.generic';

/**
 * @param {unknown} error  an axios error, an ApiError-shaped object, or anything
 * @returns {string} a translation key that always resolves
 */
export function aiErrorMessageKey(error) {
  // The backend envelope is `{ success: false, error: { code, ... } }`
  // (see backend ApiResponse.error), so the code lives at
  // `response.data.error.code`. The two legacy shapes are accepted too so a
  // caller passing an already-normalized error still maps correctly.
  const code =
    error?.response?.data?.error?.code
    || error?.response?.data?.errorCode
    || error?.code
    || error?.errorCode;
  return ERROR_KEY_BY_CODE[code] || FALLBACK_KEY;
}

export { ERROR_KEY_BY_CODE, FALLBACK_KEY };
