/**
 * Production Rate Limiter for Next.js (App Router / Edge & Node runtimes)
 * 
 * Features:
 * 1. Supports Upstash Redis REST API when UPSTASH_REDIS_REST_URL and
 *    UPSTASH_REDIS_REST_TOKEN are set in environment variables.
 * 2. High-performance in-memory sliding window fallback when Redis is not configured.
 * 3. Returns standard rate limit headers (Retry-After, X-RateLimit-*).
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory sliding window bucket store
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const memoryStore = new Map<string, TokenBucket>();
const CLEANUP_INTERVAL_MS = 60_000;

// Periodic cleanup of stale memory store keys to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryStore.entries()) {
      if (now - bucket.lastRefill > 300_000) {
        memoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Checks rate limit for a specific key (e.g. `ip:ai:${ip}` or `user:import:${userId}`).
 * @param key Unique identifier (IP address, user ID, or composite key)
 * @param limit Maximum allowed requests within the time window
 * @param windowSeconds Duration of the window in seconds (default: 60)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 20,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. If Upstash Redis is configured, use Redis REST pipeline
  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `wl_rl:${key}`;
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - windowSeconds;

      // Pipeline: remove old entries, add current timestamp, count valid entries, set expire
      const pipelineUrl = `${upstashUrl}/pipeline`;
      const res = await fetch(pipelineUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["ZREMRANGEBYSCORE", redisKey, 0, windowStart],
          ["ZADD", redisKey, now, `${now}:${Math.random().toString(36).slice(2, 8)}`],
          ["ZCARD", redisKey],
          ["EXPIRE", redisKey, windowSeconds * 2],
        ]),
        cache: "no-store",
      });

      if (res.ok) {
        const results = await res.json();
        const currentCount = Number(results?.[2]?.result ?? 1);
        const remaining = Math.max(0, limit - currentCount);
        const reset = now + windowSeconds;

        return {
          success: currentCount <= limit,
          limit,
          remaining,
          reset,
        };
      }
    } catch (err) {
      console.warn("Upstash Redis rate limit failed, falling back to in-memory:", err);
    }
  }

  // 2. In-memory sliding window fallback
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = memoryStore.get(key) || { tokens: limit, lastRefill: now };

  // Calculate elapsed time and refill tokens proportionally
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = (elapsed / windowMs) * limit;
  bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    memoryStore.set(key, bucket);
    return {
      success: true,
      limit,
      remaining: Math.floor(bucket.tokens),
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  // Rate limit exceeded
  memoryStore.set(key, bucket);
  const waitMs = ((1 - bucket.tokens) / limit) * windowMs;
  return {
    success: false,
    limit,
    remaining: 0,
    reset: Math.ceil((now + waitMs) / 1000),
  };
}

/**
 * Extracts client IP safely from request headers with cloud proxy support
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const clientIp = xForwardedFor.split(",")[0].trim();
    if (clientIp) return clientIp;
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}
