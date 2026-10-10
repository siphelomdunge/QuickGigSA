/**
 * Fixed-window rate limiter with two backends:
 *
 * - Upstash Redis (REST API, no SDK needed) when UPSTASH_REDIS_REST_URL and
 *   UPSTASH_REDIS_REST_TOKEN are set. Shared across serverless instances and deploys.
 * - In-memory fallback otherwise. Fine for local dev and single-instance servers;
 *   counts reset on restart and are not shared between instances.
 */

export interface RateLimitRule {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum hits allowed within the window. */
  max: number;
}

export interface RateLimiter {
  /** Records a hit and returns whether the key is now over the limit for any rule. */
  isOverLimit(key: string, rules: RateLimitRule[]): Promise<boolean>;
}

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

// ---- In-memory ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number };

export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const buckets = new Map<string, Bucket>();
  let lastSweep = 0;

  // Drop expired buckets occasionally so the map cannot grow without bound.
  function sweep(current: number) {
    if (current - lastSweep < MINUTE) return;
    lastSweep = current;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= current) buckets.delete(key);
    }
  }

  return {
    async isOverLimit(key, rules) {
      const current = now();
      sweep(current);
      let over = false;
      for (const rule of rules) {
        const bucketKey = `${rule.windowMs}:${key}`;
        const bucket = buckets.get(bucketKey);
        if (!bucket || bucket.resetAt <= current) {
          buckets.set(bucketKey, { count: 1, resetAt: current + rule.windowMs });
          continue;
        }
        bucket.count += 1;
        if (bucket.count > rule.max) over = true;
      }
      return over;
    },
  };
}

// ---- Upstash Redis (REST) ----------------------------------------------------------------

export function createUpstashRateLimiter(url: string, token: string, fallback: RateLimiter): RateLimiter {
  const base = url.replace(/\/$/, '');

  async function pipeline(commands: (string | number)[][]): Promise<{ result: unknown }[]> {
    const response = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Upstash responded ${response.status}`);
    return (await response.json()) as { result: unknown }[];
  }

  return {
    async isOverLimit(key, rules) {
      const now = Date.now();
      // One fixed-window key per rule, e.g. "rl:60000:user:abc:12345678". INCR then set the TTL
      // only when the key is new (NX), so the window does not slide on every hit.
      const commands = rules.flatMap((rule) => {
        const window = Math.floor(now / rule.windowMs);
        const redisKey = `rl:${rule.windowMs}:${key}:${window}`;
        return [
          ['INCR', redisKey],
          ['PEXPIRE', redisKey, rule.windowMs, 'NX'],
        ];
      });

      try {
        const results = await pipeline(commands);
        return rules.some((rule, index) => Number(results[index * 2]?.result ?? 0) > rule.max);
      } catch (error) {
        // Degrade to the in-memory limiter rather than failing open or closed on a Redis blip.
        console.warn('[rate-limit] Upstash unavailable, using in-memory fallback:', error);
        return fallback.isOverLimit(key, rules);
      }
    },
  };
}

// ---- Default instance -------------------------------------------------------------------

let defaultLimiter: RateLimiter | undefined;

export function getRateLimiter(): RateLimiter {
  if (defaultLimiter) return defaultLimiter;
  const memory = createMemoryRateLimiter();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  defaultLimiter = url && token ? createUpstashRateLimiter(url, token, memory) : memory;
  return defaultLimiter;
}

// ---- Client IP ----------------------------------------------------------------------------

/**
 * Best-effort client IP for the unauthenticated (demo mode) limit.
 *
 * `x-forwarded-for` can be set by the client, so we only trust it when the deployment
 * sits behind a known proxy. Platform-set headers (Vercel, Cloudflare) are preferred.
 * When using XFF, take the LAST address: proxies append the real peer address, while
 * anything before it was supplied by the client.
 */
export function getClientIp(headers: Headers): string {
  const platform = headers.get('x-vercel-forwarded-for') ?? headers.get('cf-connecting-ip') ?? headers.get('x-real-ip');
  if (platform) return platform.split(',')[0]!.trim();

  if (process.env.TRUST_PROXY === 'true') {
    const chain = headers.get('x-forwarded-for')?.split(',').map((part) => part.trim()).filter(Boolean) ?? [];
    if (chain.length) return chain[chain.length - 1]!;
  }

  return 'unknown';
}
