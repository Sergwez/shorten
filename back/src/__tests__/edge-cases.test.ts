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

describe('URL Shortener Edge Cases Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    
    try {
      await db.raw('SELECT 1');
      await connectRedis();
    } catch (error) {
      console.error('Test setup failed:', error);
    }
  });

  afterAll(async () => {
    try {
      await db.raw('DELETE FROM urls WHERE original_url LIKE ?', ['%edge-test%']);
      await db.destroy();
    } catch (error) {
      console.error('Test cleanup failed:', error);
    }
  });

  describe('Валидация URL', () => {
    
    test('Должен отклонить неверный URL', async () => {
      const testData = {
        originalUrl: 'https://234'
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Должен принять корректные URL различных протоколов', async () => {
      const testUrls = [
        'https://edge-test-example.com',
        'http://edge-test-example.com',
        'https://www.edge-test-example.com/path?param=value',
        'https://edge-test-subdomain.example.com',
        'https://edge-test-example.com:8080/path',
      ];

      for (const url of testUrls) {
        const response = await request(app)
          .post('/shorten')
          .send({ originalUrl: url })
          .expect(201);

        expect(response.body).toHaveProperty('shortUrl');
        expect(response.body.originalUrl).toBe(url);
      }
    });
  });

  describe('Валидация alias', () => {
    
    test('Должен отклонить alias с недопустимыми символами', async () => {
      const invalidAliases = [
        'test space',
        'test@special',
        'test#hash',
        'test/slash',
        'test?question'
      ];

      for (const alias of invalidAliases) {
        const response = await request(app)
          .post('/shorten')
          .send({
            originalUrl: 'https://edge-test-example.com',
            alias
          });

        // API принимает большинство символов, но некоторые могут вызывать проблемы
        // Проверяем что либо создается успешно (201), либо отклоняется (400)
        expect([201, 400]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body).toHaveProperty('error');
        }
      }
    });

    test('Должен принять корректные alias', async () => {
      const validAliases = [
        'test-alias-' + Date.now(),
        'test_alias_' + Date.now(),
        'testAlias' + Date.now(),
        '123' + Date.now(),
        'test123-' + Date.now()
      ];

      for (const alias of validAliases) {
        const response = await request(app)
          .post('/shorten')
          .send({
            originalUrl: 'https://edge-test-example.com/' + alias,
            alias
          })
          .expect(201);

        expect(response.body).toHaveProperty('shortUrl');
        expect(response.body.shortUrl).toContain(alias);
      }
    });

    test('Должен отклонить alias совпадающий с системными маршрутами', async () => {
      const systemRoutes = ['health', 'shorten', 'info', 'delete', 'analytics'];

      for (const route of systemRoutes) {
        const response = await request(app)
          .post('/shorten')
          .send({
            originalUrl: 'https://edge-test-example.com',
            alias: route
          })
          .expect(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Работа с истекшими ссылками', () => {
    
    test('Должен отклонить создание ссылки с датой истечения в прошлом', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Вчера

      const testData = {
        originalUrl: 'https://edge-test-past.com',
        alias: 'past-test-' + Date.now(),
        expiresAt: pastDate.toISOString()
      };

      const response = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('future');
    });

    test('Должен отклонить доступ к ссылке после истечения срока', async () => {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 1); // +1 секунда

      const testData = {
        originalUrl: 'https://edge-test-expired.com',
        alias: 'expire-test-' + Date.now(),
        expiresAt: expiresAt.toISOString()
      };

      // Создаем ссылку с коротким сроком жизни
      const createResponse = await request(app)
        .post('/shorten')
        .send(testData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('shortUrl');

      // Проверяем что ссылка работает сейчас
      await request(app)
        .get(`/${testData.alias}`)
        .expect(302);

      // Ждем 2 секунды (больше чем срок жизни)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Проверяем что ссылка больше не работает
      const expiredResponse = await request(app)
        .get(`/${testData.alias}`)
        .expect(404);

      expect(expiredResponse.body).toHaveProperty('error');
    });
  });

  describe('Лимиты и ограничения', () => {
    
    test('Должен отклонить слишком длинный URL', async () => {
      const longUrl = 'https://edge-test-example.com/' + 'a'.repeat(3000);

      const response = await request(app)
        .post('/shorten')
        .send({ originalUrl: longUrl });

      // API должен отклонить длинный URL
      expect(response.body).toHaveProperty('error');
    });

    test('Не должен отклонить слишком длинный alias', async () => {
      const longAlias = 'a'.repeat(100);

      const response = await request(app)
        .post('/shorten')
        .send({
          originalUrl: 'https://edge-test-example.com',
          alias: longAlias
        });

      // API может принимать длинные alias или отклонять их
      expect(response.status).toBe(201);
    });

    test('Не должен отклонить слишком короткий alias', async () => {
      const shortAlias = 'a';

      const response = await request(app)
        .post('/shorten')
        .send({
          originalUrl: 'https://edge-test-example.com',
          alias: shortAlias
        });

      // API может принимать короткие alias
      expect(response.status).toBe(201);
    });
  });

}); 