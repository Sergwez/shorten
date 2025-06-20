import { redisClient, connectRedis } from '../cache/redis.client';
import { CacheService } from '../services/cache.service';

describe('URL Shortener Cache Tests', () => {
  let cacheService: CacheService;

  beforeAll(async () => {
    try {
      await connectRedis();
      cacheService = new CacheService();
    } catch (error) {
      console.error('Cache test setup failed:', error);
    }
  });

  afterAll(async () => {
    try {
      if (redisClient.isReady) {
        await redisClient.quit();
      }
    } catch (error) {
      console.error('Cache test cleanup failed:', error);
    }
  });

  beforeEach(async () => {
    // Очищаем кэш перед каждым тестом
    try {
      await redisClient.flushAll();
    } catch (error) {
      // Если flushAll недоступен, пробуем другие методы
      try {
        const keys = await redisClient.keys('url:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (e) {
        // Игнорируем ошибки очистки в тестах
      }
    }
  });

  describe('Базовые операции кэша', () => {
    
    test('Должен сохранить и получить значение из кэша', async () => {
      const key = 'url:test-basic';
      const value = 'https://example.com';
      const ttl = 3600;

      await cacheService.set(key, value, ttl);
      const cachedValue = await cacheService.get(key);
      
      expect(cachedValue).toBe(value);
    });

    test('Должен вернуть null для несуществующего ключа', async () => {
      const key = 'url:nonexistent';
      
      const cachedValue = await cacheService.get(key);
      
      expect(cachedValue).toBeNull();
    });

    test('Должен проверить существование ключа', async () => {
      const key = 'url:test-exists';
      const value = 'https://example.com';

      // Проверяем что ключа нет
      let exists = await cacheService.exists(key);
      expect(exists).toBe(false);

      // Добавляем ключ
      await cacheService.set(key, value);

      // Проверяем что ключ есть
      exists = await cacheService.exists(key);
      expect(exists).toBe(true);
    });

    test('Должен удалить ключ из кэша', async () => {
      const key = 'url:test-delete';
      const value = 'https://example.com';

      // Добавляем ключ
      await cacheService.set(key, value);
      
      let cachedValue = await cacheService.get(key);
      expect(cachedValue).toBe(value);

      // Удаляем ключ
      await cacheService.del(key);

      // Проверяем что ключ удален
      cachedValue = await cacheService.get(key);
      expect(cachedValue).toBeNull();
    });
  });

  describe('TTL и истечение кэша', () => {
    
    test('Должен истечь TTL и вернуть null после истечения', async () => {
      const key = 'url:test-ttl';
      const value = 'https://example.com';
      const shortTtl = 1; // 1 секунда

      // Сохраняем с коротким TTL
      await cacheService.set(key, value, shortTtl);

      // Проверяем что значение есть
      let cachedValue = await cacheService.get(key);
      expect(cachedValue).toBe(value);

      // Ждем истечения TTL
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Проверяем что значение истекло
      cachedValue = await cacheService.get(key);
      expect(cachedValue).toBeNull();
    });

    test('Должен правильно работать с адаптивным TTL для популярных ссылок', async () => {
      const key = 'url:test-popularity';
      const value = 'https://popular-example.com';
      const baseViews = 100;

      // Используем метод с бонусом популярности
      await cacheService.setWithPopularityBonus(key, value, baseViews);

      // Проверяем что значение сохранено
      const cachedValue = await cacheService.get(key);
      expect(cachedValue).toBe(value);

      // Проверяем TTL - должен быть больше обычного из-за популярности
      const ttl = await redisClient.ttl(key);
      expect(ttl).toBeGreaterThan(3600);
    });
  });

  describe('Пакетные операции', () => {
    
    test('Должен получить несколько ключей одновременно', async () => {
      const keys = ['url:batch1', 'url:batch2', 'url:batch3'];
      const values = [
        'https://example1.com',
        'https://example2.com', 
        'https://example3.com'
      ];

      // Сохраняем все ключи
      for (let i = 0; i < keys.length; i++) {
        await cacheService.set(keys[i], values[i]);
      }

      // Получаем все ключи одним запросом
      const results = await cacheService.mget(keys);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(values[0]);
      expect(results[1]).toBe(values[1]);
      expect(results[2]).toBe(values[2]);
    });

    test('Должен вернуть null для несуществующих ключей в batch запросе', async () => {
      const keys = ['url:exists', 'url:missing', 'url:exists2'];
      const values = ['https://example1.com', 'https://example2.com'];

      // Сохраняем только первый и третий ключ
      await cacheService.set(keys[0], values[0]);
      await cacheService.set(keys[2], values[1]);

      // Получаем все ключи
      const results = await cacheService.mget(keys);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(values[0]); // существует
      expect(results[1]).toBeNull();       // не существует
      expect(results[2]).toBe(values[1]);  // существует
    });
  });

  describe('Производительность кэша', () => {
    
    test('Должен обрабатывать множественные операции быстро', async () => {
      const operations = 100;
      const keys: string[] = [];
      const values: string[] = [];

      // Подготавливаем данные
      for (let i = 0; i < operations; i++) {
        keys.push(`url:perf-test-${i}`);
        values.push(`https://example-${i}.com`);
      }

      // Измеряем время записи
      const writeStart = Date.now();
      const writePromises = keys.map((key, i) => 
        cacheService.set(key, values[i])
      );
      await Promise.all(writePromises);
      const writeTime = Date.now() - writeStart;

      // Измеряем время чтения
      const readStart = Date.now();
      const readPromises = keys.map(key => cacheService.get(key));
      const results = await Promise.all(readPromises);
      const readTime = Date.now() - readStart;

      // Проверяем результаты
      expect(results).toHaveLength(operations);
      results.forEach((result, i) => {
        expect(result).toBe(values[i]);
      });

      // Проверяем производительность (должно быть быстро)
      expect(writeTime).toBeLessThan(5000); // Менее 5 секунд на запись 100 ключей
      expect(readTime).toBeLessThan(1000);  // Менее 1 секунды на чтение 100 ключей
    });
  });

  describe('Обработка ошибок кэша', () => {
    
    test('Должен корректно обрабатывать ошибки при недоступности Redis', async () => {
      // Тестируем с невалидным ключом (слишком длинным)
      const longKey = 'url:' + 'x'.repeat(1000);
      const value = 'https://example.com';

      // Эти операции не должны бросать исключения
      await expect(cacheService.set(longKey, value)).resolves.toBeUndefined();
      await expect(cacheService.get(longKey)).resolves.toBeDefined();
      await expect(cacheService.exists(longKey)).resolves.toBeDefined();
      await expect(cacheService.del(longKey)).resolves.toBeUndefined();
    });
  });

  describe('Сценарии кэширования ссылок', () => {
    
    test('Cache HIT - должен получить ссылку из кэша', async () => {
      const shortUrl = 'abc123';
      const originalUrl = 'https://cache-hit-example.com';
      const cacheKey = `url:${shortUrl}`;

      // Сохраняем ссылку в кэш
      await cacheService.set(cacheKey, originalUrl, 3600);

      // Проверяем что ссылка в кэше
      const cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBe(originalUrl);

      // Проверяем повторные обращения к кэшу
      for (let i = 0; i < 5; i++) {
        const result = await cacheService.get(cacheKey);
        expect(result).toBe(originalUrl);
      }
    });

    test('Cache EXPIRED - должен обновить кэш после истечения TTL', async () => {
      const shortUrl = 'expired123';
      const originalUrl = 'https://cache-expired-example.com';
      const cacheKey = `url:${shortUrl}`;

      // Сохраняем ссылку с коротким TTL
      await cacheService.set(cacheKey, originalUrl, 1);

      // Проверяем что ссылка в кэше
      let cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBe(originalUrl);

      // Ждем истечения TTL
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Проверяем что кэш истек
      cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBeNull();

      // Имитируем повторное кэширование после получения из БД
      await cacheService.set(cacheKey, originalUrl, 3600);

      // Проверяем что ссылка снова в кэше
      cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBe(originalUrl);
    });

    test('Cache MISS - должен получить ссылку из БД и закэшировать', async () => {
      const shortUrl = 'miss123';
      const originalUrl = 'https://cache-miss-example.com';
      const cacheKey = `url:${shortUrl}`;

      // Проверяем что ссылки нет в кэше
      let cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBeNull();

      // Имитируем получение из БД и кэширование
      await cacheService.set(cacheKey, originalUrl, 3600);

      // Проверяем что ссылка теперь в кэше
      cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBe(originalUrl);
    });

    test('Должен удалить из кэша при удалении ссылки', async () => {
      const shortUrl = 'delete123';
      const originalUrl = 'https://cache-delete-example.com';
      const cacheKey = `url:${shortUrl}`;

      // Сохраняем ссылку в кэш
      await cacheService.set(cacheKey, originalUrl, 3600);

      // Проверяем что ссылка в кэше
      let cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBe(originalUrl);

      // Удаляем из кэша
      await cacheService.del(cacheKey);

      // Проверяем что ссылка удалена из кэша
      cachedUrl = await cacheService.get(cacheKey);
      expect(cachedUrl).toBeNull();
    });
  });

}); 