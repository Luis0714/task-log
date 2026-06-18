export type RateLimiter = {
  consume(userId: string, cost?: number): { allowed: boolean; retryAfterMs?: number };
};

type Bucket = { tokens: number; lastRefill: number };

export function createTokenBucket(opts: {
  capacity: number;
  refillPerMinute: number;
}): RateLimiter {
  const buckets = new Map<string, Bucket>();
  const refillPerMs = opts.refillPerMinute / 60_000;

  return {
    consume(userId, cost = 1) {
      const now = Date.now();
      const bucket =
        buckets.get(userId) ?? { tokens: opts.capacity, lastRefill: now };
      const elapsed = now - bucket.lastRefill;
      const refilled = Math.min(
        opts.capacity,
        bucket.tokens + elapsed * refillPerMs,
      );
      bucket.tokens = refilled;
      bucket.lastRefill = now;

      if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        buckets.set(userId, bucket);
        return { allowed: true };
      }

      buckets.set(userId, bucket);
      const deficit = cost - bucket.tokens;
      const retryAfterMs = Math.ceil(deficit / refillPerMs);
      return { allowed: false, retryAfterMs };
    },
  };
}

let previewLimiter: RateLimiter | undefined;
let createTasksLimiter: RateLimiter | undefined;

export function getPreviewRateLimiter(): RateLimiter {
  if (!previewLimiter) {
    previewLimiter = createTokenBucket({ capacity: 20, refillPerMinute: 20 });
  }
  return previewLimiter;
}

export function getCreateTasksRateLimiter(): RateLimiter {
  if (!createTasksLimiter) {
    createTasksLimiter = createTokenBucket({ capacity: 6, refillPerMinute: 6 });
  }
  return createTasksLimiter;
}