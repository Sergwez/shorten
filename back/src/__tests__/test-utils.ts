import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import urlRoutes from '../routes/url.routes';
import { errorHandler, notFoundHandler } from '../middleware/middleware';
import { Routes } from '../enums/routes.enum';

/**
 * Создает тестовое приложение Express с полной конфигурацией
 */
export const createTestApp = (): express.Application => {
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

/**
 * Генерирует уникальный алиас для тестов
 */
export const generateTestAlias = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Генерирует тестовый URL
 */
export const generateTestUrl = (path: string = ''): string => {
  const baseUrl = 'https://test-example.com';
  return path ? `${baseUrl}/${path}` : baseUrl;
};

/**
 * Создает тестовые данные для создания короткой ссылки
 */
export interface TestUrlData {
  originalUrl: string;
  alias?: string;
  expiresAt?: string;
}

export const createTestUrlData = (overrides: Partial<TestUrlData> = {}): TestUrlData => {
  return {
    originalUrl: generateTestUrl(),
    alias: generateTestAlias(),
    ...overrides
  };
};

/**
 * Создает дату истечения для тестов
 */
export const createExpirationDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

/**
 * Задержка в миллисекундах
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Массив корректных тестовых URL
 */
export const VALID_TEST_URLS = [
  'https://example.com',
  'http://example.com',
  'https://www.example.com/path',
  'https://subdomain.example.com',
  'https://example.com:8080/path?param=value',
  'https://example.com/path#fragment'
];

/**
 * Массив некорректных URL для тестирования валидации
 */
export const INVALID_URLS = [
  'not-a-url',
  'ftp://example.com',
  'javascript:alert("xss")',
  'data:text/html,<script>alert("xss")</script>',
  'file:///etc/passwd',
  '',
  ' ',
  'http://',
  'https://',
  'example.com' // без протокола
];

/**
 * Массив некорректных алиасов для тестирования валидации
 */
export const INVALID_ALIASES = [
  'test space',
  'test@email',
  'test#hash',
  'test/slash',
  'test?question',
  'test%encoded',
  'test&ampersand',
  'test+plus',
  '',
  ' ',
  'a', // слишком короткий
  'ab', // слишком короткий
  'a'.repeat(51) // слишком длинный
];

/**
 * Массив корректных алиасов для тестирования
 */
export const VALID_ALIASES = [
  'valid-alias',
  'valid_alias',
  'validAlias',
  'ValidAlias123',
  'test123',
  '123test',
  'a'.repeat(3), // минимальная длина
  'a'.repeat(50) // максимальная длина
];

/**
 * Системные маршруты, которые нельзя использовать как алиасы
 */
export const SYSTEM_ROUTES = [
  'health',
  'shorten', 
  'info',
  'delete',
  'analytics'
];

/**
 * Потенциально опасные URL для тестирования безопасности
 */
export const MALICIOUS_URLS = [
  'javascript:alert("xss")',
  'data:text/html,<script>alert("xss")</script>',
  'vbscript:msgbox("xss")',
  'file:///etc/passwd',
  'ftp://malicious.com'
];

/**
 * SQL injection попытки для тестирования
 */
export const SQL_INJECTION_ATTEMPTS = [
  "'; DROP TABLE urls; --",
  "1' OR '1'='1",
  "admin'--",
  "'; INSERT INTO urls VALUES ('hack'); --",
  "1'; UPDATE urls SET original_url='hacked'; --",
  "' UNION SELECT * FROM users; --"
];

/**
 * XSS попытки для тестирования
 */
export const XSS_ATTEMPTS = [
  '<script>alert("xss")</script>',
  '<img src="x" onerror="alert(\'xss\')">',
  'javascript:alert("xss")',
  '<svg onload="alert(\'xss\')">',
  '"><script>alert("xss")</script>'
];

/**
 * Утилита для очистки тестовых данных из БД
 */
export const cleanupTestData = async (db: any, pattern: string = '%test%'): Promise<void> => {
  try {
    await db.raw('DELETE FROM urls WHERE original_url LIKE ?', [pattern]);
    await db.raw('DELETE FROM url_analytics WHERE url_id NOT IN (SELECT id FROM urls)');
    console.log(`Cleaned up test data matching pattern: ${pattern}`);
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
};

/**
 * Утилита для создания множественных тестовых URL
 */
export const createMultipleTestUrls = (count: number, prefix: string = 'bulk'): TestUrlData[] => {
  return Array.from({ length: count }, (_, index) => ({
    originalUrl: generateTestUrl(`${prefix}/${index}`),
    alias: generateTestAlias(`${prefix}-${index}`)
  }));
};

/**
 * Матчеры для Jest
 */
export const customMatchers = {
  toBeValidShortUrl: (received: any) => {
    const pass = typeof received === 'string' && received.length > 0;
    return {
      message: () => `expected ${received} to be a valid short URL`,
      pass
    };
  },
  
  toHaveValidTimestamp: (received: any) => {
    const pass = typeof received === 'string' && !isNaN(Date.parse(received));
    return {
      message: () => `expected ${received} to be a valid timestamp`,
      pass
    };
  }
}; 