import { redisClient } from '../cache/redis.client';

export class CacheService {
  private defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '3600'); // 1 час по умолчанию

  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Не ломаем основную логику при ошибке кеша
    }
  }

  async set(key: string, value: string, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, value);
    } catch (error) {
      console.error('Cache set error:', error);
      // Не ломаем основную логику при ошибке кеша
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Увеличиваем TTL для популярных ссылок
  async setWithPopularityBonus(key: string, value: string, baseViews: number = 0): Promise<void> {
    // Чем больше просмотров, тем дольше кешируем (максимум 24 часа)
    const bonusTTL = Math.min(baseViews * 10, 86400);
    const finalTTL = this.defaultTTL + bonusTTL;
    
    await this.set(key, value, finalTTL);
  }

  // Пакетное получение для оптимизации
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await redisClient.mGet(keys);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }


}

export const cacheService = new CacheService(); 