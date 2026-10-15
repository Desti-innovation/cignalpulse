/**
 * Simple in-memory rate limiter.
 *
 * NOTE: This works for single-server deployments.
 * For multi-region/serverless at scale, swap for Upstash Redis
 * (also free tier) — see https://upstash.com/docs/redis/sdks/ratelimit-ts
 */

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Clean up old entries every 5 minutes to prevent memory bloat
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt < now) buckets.delete(key)
      }
    },
    5 * 60 * 1000
  )
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds?: number
}

/**
 * Check if an action is allowed under the rate limit.
 *
 * @param key      Unique identifier (e.g. `login:1.2.3.4` or `send:userId:42`)
 * @param limit    Max number of requests
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    // New window
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    // Over the limit
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  // Within limit
  bucket.count++
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

// ============================================================
// Preset rate limits
// ============================================================

export const RateLimits = {
  /** Login attempts: 5 per 15 min per IP+username */
  login: { limit: 5, windowMs: 15 * 60 * 1000 },

  /** Admin login: 3 per 15 min per IP */
  adminLogin: { limit: 3, windowMs: 15 * 60 * 1000 },

  /** Signup / Sender ID request: 3 per hour per IP */
  signup: { limit: 3, windowMs: 60 * 60 * 1000 },

  /** Send SMS: 30 campaigns per hour per user */
  sendSms: { limit: 30, windowMs: 60 * 60 * 1000 },

  /** Create contact: 200 per hour per user */
  createContact: { limit: 200, windowMs: 60 * 60 * 1000 },

  /** CSV import: 5 per hour per user */
  importCsv: { limit: 5, windowMs: 60 * 60 * 1000 },

  /** Password change: 3 per hour per user */
  changePassword: { limit: 3, windowMs: 60 * 60 * 1000 },

  /** Password reset request: 3 per hour per email */
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 },
} as const

// ============================================================
// Helpers
// ============================================================

/**
 * Extract client IP from a Request (works on Vercel + most proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}