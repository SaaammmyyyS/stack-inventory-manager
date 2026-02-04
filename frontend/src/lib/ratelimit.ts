import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
  token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN,
});

export const productRateLimiter = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ratelimit_free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: true,
    prefix: "ratelimit_pro",
  }),
};

export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 d"),
  analytics: true,
  prefix: "ratelimit_ai",
});