/**
 * Edge Function: rate-limiter (shared utility)
 * Simple in-memory rate limiter for API endpoints.
 *
 * NOTE: This is best-effort. In-memory state resets on cold starts.
 * For production, use Netlify Rate Limiting add-on or a Redis-backed solution.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60000) // every 60s

export function rateLimit(
  req: Request,
  options: { windowMs?: number; maxRequests?: number } = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = options.windowMs || 60000 // default 1 min
  const maxRequests = options.maxRequests || 60 // default 60 req/min

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const key = `${ip}:${new URL(req.url).pathname}`
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt }
  }

  entry.count++
  store.set(key, entry)

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Middleware wrapper: applies rate limiting to an edge function handler.
 * Returns 429 if rate limit exceeded.
 */
export function withRateLimit(
  handler: (req: Request, context: unknown) => Promise<Response>,
  options?: { windowMs?: number; maxRequests?: number }
) {
  return async (req: Request, context: unknown) => {
    const { allowed, remaining, resetAt } = rateLimit(req, options)

    if (!allowed) {
      return new Response(JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAt),
        },
      })
    }

    const response = await handler(req, context)
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(resetAt))
    return response
  }
}
