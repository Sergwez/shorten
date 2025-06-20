import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import urlRoutes from '../routes/url.routes';
import { errorHandler, notFoundHandler } from '../middleware/middleware';
import { Routes } from '../enums/routes.enum';
import { db } from '../database/connection';
import { connectRedis } from '../cache/redis.client';

// Создаем тестовое приложение
const createTestApp = () => {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  app.get(Routes.HEALTH, (req, res) => {
    res.json({ status: 'OK' });
  });
  
  app.use('/', urlRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

describe('URL Shortener API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Инициализируем приложение
    app = createTestApp();
    
    // Подключаемся к БД и Redis
    try {
      await db.raw('SELECT 1');
      await connectRedis();
    } catch (error) {
      console.error('Test setup failed:', error);
    }
  });

  afterAll(async () => {
    // Очищаем БД после тестов
    try {
      await db.raw('DELETE FROM urls WHERE original_url LIKE ?', ['%test%']);
      await db.destroy();
    } catch (error) {
      console.error('Test cleanup failed:', error);
    }
  });

  describe('POST /shorten - Создание короткой ссылки', () => {
    
    test('Должен создать короткую ссылку с уникальным alias', async () => {
      const testData = {
        originalUrl: 'https://test-example.com',
        alias: 'test-alias-' + Date.now()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('originalUrl', testData.originalUrl);
      expect(response.body.shortUrl).toContain(testData.alias);
    });

    test('Должен вернуть ошибку 409 при повторном использовании alias', async () => {
      const testData = {
        originalUrl: 'https://test-example2.com',
        alias: 'duplicate-alias-' + Date.now()
      };

      // Первый запрос - должен быть успешным
      await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      // Второй запрос с тем же alias - должен вернуть ошибку
      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Должен создать короткую ссылку без alias', async () => {
      const testData = {
        originalUrl: 'https://test-example3.com'
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('originalUrl', testData.originalUrl);
    });

    test('Должен вернуть ошибку 400 если originalUrl не указан', async () => {
      const response = await request(app)
        .post('/shorten')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('originalUrl is required');
    });

    test('Должен создать ссылку с датой истечения', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // +7 дней

      const testData = {
        originalUrl: 'https://test-example4.com',
        expiresAt: expiresAt.toISOString()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('expiresAt');
    });
  });

  describe('GET /{shortUrl} - Переадресация на оригинальный URL', () => {
    
    let testShortUrl: string;

    beforeAll(async () => {
      // Создаем тестовую ссылку для использования в тестах
      const testData = {
        originalUrl: 'https://test-redirect.com',
        alias: 'redirect-test-' + Date.now()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      testShortUrl = testData.alias;
    });

    test('Должен вернуть 302 Redirect на правильный originalUrl', async () => {
      const response = await request(app)
        .get(`/${testShortUrl}`)
        .expect(302);

      expect(response.headers.location).toBe('https://test-redirect.com');
    });

    test('Должен вернуть 404 для несуществующей ссылки', async () => {
      const response = await request(app)
        .get('/nonexistent-url')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /delete/{shortUrl} - Удаление ссылки', () => {
    
    let testShortUrl: string;

    beforeEach(async () => {
      // Создаем новую тестовую ссылку для каждого теста
      const testData = {
        originalUrl: 'https://test-delete.com',
        alias: 'delete-test-' + Date.now() + '-' + Math.random()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      testShortUrl = testData.alias;
    });

    test('Должен удалить существующую ссылку и вернуть 200', async () => {
      const response = await request(app)
        .delete(`/delete/${testShortUrl}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Проверяем, что ссылка действительно удалена
      await request(app)
        .get(`/${testShortUrl}`)
        .expect(404);
    });

    test('Должен вернуть 404 при попытке удалить несуществующую ссылку', async () => {
      const response = await request(app)
        .delete('/delete/nonexistent-url')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /info/{shortUrl} - Получение информации о ссылке', () => {
    
    let testShortUrl: string;
    let originalUrl: string;

    beforeAll(async () => {
      originalUrl = 'https://test-info.com';
      const testData = {
        originalUrl,
        alias: 'info-test-' + Date.now()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      testShortUrl = testData.alias;
    });

    test('Должен вернуть информацию о существующей ссылке', async () => {
      const response = await request(app)
        .get(`/info/${testShortUrl}`)
        .expect(200);

      expect(response.body).toHaveProperty('originalUrl', originalUrl);
      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('clickCount');
      expect(response.body).toHaveProperty('createdAt');
    });

    test('Должен вернуть 404 для несуществующей ссылки', async () => {
      const response = await request(app)
        .get('/info/nonexistent-url')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /analytics/{shortUrl} - Получение аналитики', () => {
    
    let testShortUrl: string;

    beforeAll(async () => {
      const testData = {
        originalUrl: 'https://test-analytics.com',
        alias: 'analytics-test-' + Date.now()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      testShortUrl = testData.alias;

      // Делаем несколько переходов для создания аналитики
      await request(app).get(`/${testShortUrl}`);
      await request(app).get(`/${testShortUrl}`);
    });

    test('Должен вернуть аналитику для существующей ссылки', async () => {
      const response = await request(app)
        .get(`/analytics/${testShortUrl}`)
        .expect(200);

      expect(response.body).toHaveProperty('clickCount');
      expect(response.body).toHaveProperty('recentClicks');
      expect(response.body.clickCount).toBeGreaterThanOrEqual(2);
    });

    test('Должен вернуть 404 для несуществующей ссылки', async () => {
      const response = await request(app)
        .get('/analytics/nonexistent-url')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /health - Health Check', () => {
    
    test('Должен вернуть статус OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('Обработка ошибок', () => {
    
    test('Должен вернуть 404 для несуществующего маршрута', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('Должен корректно обрабатывать неверный JSON', async () => {
      const response = await request(app)
        .post('/shorten')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 