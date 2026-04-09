import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

let redisAvailable = true;

function createRedisConnection(): IORedis | undefined {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[redis] REDIS_URL not set — queue features disabled");
    return undefined;
  }

  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 5) {
        redisAvailable = false;
        console.warn("[redis] Connection failed after 5 retries — queue features disabled");
        return null;
      }
      return Math.min(times * 1000, 5000);
    },
  });

  conn.on("error", (err) => {
    if (redisAvailable) {
      console.warn("[redis] Connection error:", err.message);
      redisAvailable = false;
    }
  });

  conn.on("connect", () => {
    redisAvailable = true;
    console.log("[redis] Connected");
  });

  return conn;
}

export const redis =
  globalForRedis.redis ?? createRedisConnection();

export function isRedisAvailable(): boolean {
  return redisAvailable && redis !== undefined;
}

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}
