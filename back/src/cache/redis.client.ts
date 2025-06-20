import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

export const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
  socket: {
    connectTimeout: 5000,
    noDelay: true
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
      console.log('Redis connected successfully');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

export default redisClient; 