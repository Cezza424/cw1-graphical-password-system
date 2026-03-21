type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
  lockoutMs?: number;
};

type Entry = {
  count: number;
  resetAt: number;
  lockedUntil: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

declare global {
  var rateLimitStore: Map<string, Entry> | undefined;
}

const store = global.rateLimitStore ?? new Map<string, Entry>();
if (!global.rateLimitStore) {
  global.rateLimitStore = store;
}

function toSeconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000));
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (existing && existing.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: toSeconds(existing.lockedUntil - now),
    };
  }

  const inWindow = existing && existing.resetAt > now;
  const current: Entry = inWindow
    ? {
        count: existing.count,
        resetAt: existing.resetAt,
        lockedUntil: existing.lockedUntil,
      }
    : {
        count: 0,
        resetAt: now + config.windowMs,
        lockedUntil: 0,
      };

  current.count += 1;

  if (current.count > config.maxAttempts) {
    const lockoutMs = config.lockoutMs ?? config.windowMs;
    current.lockedUntil = now + lockoutMs;
    store.set(key, current);

    return {
      allowed: false,
      retryAfterSeconds: toSeconds(lockoutMs),
    };
  }

  store.set(key, current);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
