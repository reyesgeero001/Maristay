/**
 * Login brute-force protection (Lab 06 "Rate Limiting").
 * Default: 5 attempts per IP per 60 seconds, then HTTP 429.
 * LOGIN_RATE_LIMIT can raise this for automated test runs.
 */
export const loginRateLimit = () => ({
  limit: () => Number(process.env.LOGIN_RATE_LIMIT ?? 5),
  ttl: 60_000,
});

/** General API limit per IP per minute. */
export const globalRateLimit = () => Number(process.env.API_RATE_LIMIT ?? 300);
