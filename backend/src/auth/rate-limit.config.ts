/**
 * Login brute-force protection (Lab 06 "Rate Limiting").
 * Default: 10 attempts per IP per 60 seconds, then HTTP 429
 * (enough for one person to log in each demo role, too few for brute force).
 * LOGIN_RATE_LIMIT can raise this for automated test runs.
 */
export const loginRateLimit = () => ({
  limit: () => Number(process.env.LOGIN_RATE_LIMIT ?? 10),
  ttl: 60_000,
});

/** General API limit per IP per minute. */
export const globalRateLimit = () => Number(process.env.API_RATE_LIMIT ?? 300);
