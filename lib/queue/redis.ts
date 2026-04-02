import IORedis from "ioredis";

// Prevent multiple Redis connections in dev hot-reload
const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

// maxRetriesPerRequest: null is mandatory for BullMQ — it uses blocking commands
export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 1000, 5000),
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
