import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 5 request per 5 seconds
export const normalRatelimit = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(5, '5 s'),
	analytics: false
});

// 1 request per 15 seconds
export const sensitiveRatelimit = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(1, '15 s'),
	analytics: false
});
