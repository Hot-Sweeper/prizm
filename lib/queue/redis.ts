import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

function createRedisConnection(): IORedis | undefined {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[redis] REDIS_URL not set — queue features disabled");
    return undefined;
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 1000, 5000),
  });
}

export const redis =
  globalForRedis.redis ?? createRedisConnection();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}
