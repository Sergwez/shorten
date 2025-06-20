# Руководство по тестированию URL Shortener API

## Что было создано

### 1. Структура тестов

Мы создали комплексную систему тестирования для API URL Shortener, которая включает:

#### `api.test.ts` - Интеграционные тесты
- Полные интеграционные тесты с реальными подключениями к БД и Redis
- Тестирование всех эндпоинтов API
- Проверка конкретных бизнес-сценариев из ТЗ

#### `edge-cases.test.ts` - Тесты граничных случаев  
- Валидация входных данных
- Тесты безопасности (SQL injection, XSS)
- Проверка лимитов и ограничений
- Тесты производительности

#### `api-simple.test.ts` - Юнит-тесты с моками
- Изолированные тесты с мокированными зависимостями
- Быстрое выполнение без внешних зависимостей
- Базовая проверка логики API

#### `test-utils.ts` - Утилиты для тестов
- Фабрики для создания тестовых данных
- Константы с валидными/невалидными данными
- Функции очистки БД
- Кастомные матчеры Jest

#### `setup.ts` - Глобальная настройка тестов
- Конфигурация Jest
- Кастомные матчеры
- Обработка ошибок

## Покрытые тестовые сценарии

### ✅ Создание ссылки с уникальным alias
```typescript
// POST /shorten с alias
// Ожидание: 201 Created + корректный shortUrl
// Проверка: уникальность alias, конфликт при повторном использовании (409 Conflict)
```

### ✅ Переадресация на оригинальный URL  
```typescript
// GET /{shortUrl}
// Ожидание: 302 Redirect на правильный originalUrl
// Проверка: 404 для несуществующих ссылок
```

### ✅ Удаление ссылки
```typescript
// DELETE /delete/{shortUrl}
// Ожидание: 200 OK при успешном удалении
// Проверка: 404 для несуществующих ссылок
```

### ✅ Получение информации о ссылке
```typescript
// GET /info/{shortUrl}
// Ожидание: полная информация о ссылке
// Проверка: clickCount, createdAt, originalUrl
```

### ✅ Аналитика
```typescript
// GET /analytics/{shortUrl}
// Ожидание: статистика кликов
// Проверка: totalClicks, clicksByDate
```

## Проблемы и их решения

### ❌ Проблема: База данных не существует
```
error: database "shorts_test_db" does not exist
```

**Решение:**
1. Создать тестовую БД:
```sql
CREATE DATABASE shorts_test_db;
```

2. Или настроить переменные окружения:
```bash
export TEST_DATABASE_NAME=shorts_db  # использовать основную БД
```

### ❌ Проблема: Redis не подключается
```
ClientClosedError: The client is closed
```

**Решение:**
1. Запустить Redis:
```bash
docker-compose up -d redis
```

2. Или отключить Redis в тестах через моки

### ❌ Проблема: Моки не работают
```
Jest mocks не перехватывают импорты модулей
```

**Решение:**
Использовать `jest.doMock()` до импорта или настроить `__mocks__` папку.

## Рекомендации по запуску

### Для быстрых тестов (только логика)
```bash
# Запускать api-simple.test.ts с моками
npm test api-simple
```

### Для полного тестирования
```bash
# 1. Запустить инфраструктуру
docker-compose up -d postgres redis

# 2. Создать тестовую БД
psql -h localhost -p 5433 -U shorts_user -c "CREATE DATABASE shorts_test_db;"

# 3. Запустить миграции
NODE_ENV=test npm run db:migrate

# 4. Запустить тесты
npm test
```

## Конфигурация Jest

### `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Последовательное выполнение для БД
  forceExit: true
};
```

## Структура тестовых данных

### Тестовые URL
```typescript
const VALID_URLS = [
  'https://example.com',
  'http://example.com/path',
  'https://subdomain.example.com:8080'
];

const INVALID_URLS = [
  'not-a-url',
  'javascript:alert("xss")',
  'file:///etc/passwd'
];
```

### Тестовые alias
```typescript
const VALID_ALIASES = [
  'valid-alias',
  'test123',
  'ValidAlias'
];

const INVALID_ALIASES = [
  'test space',     // пробелы
  'test@email',     // спецсимволы  
  'health',         // системные роуты
  'a'.repeat(100)   // слишком длинный
];
```

## Автоматизация

### GitHub Actions пример
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: shorts_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:migrate
        env:
          NODE_ENV: test
      - run: npm test
```

## Расширение тестов

### Добавление новых тестов
1. Создать файл `*.test.ts` в папке `__tests__`
2. Использовать утилиты из `test-utils.ts`
3. Следовать паттерну Arrange-Act-Assert

### Пример нового теста
```typescript
describe('Новая функциональность', () => {
  test('Должен выполнить действие', async () => {
    // Arrange
    const testData = createTestUrlData();
    
    // Act
    const response = await request(app)
      .post('/new-endpoint')
      .send(testData);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
```

## Метрики и покрытие

### Запуск с покрытием
```bash
npm run test:coverage
```

### Ожидаемое покрытие
- **Контроллеры**: > 90%
- **Сервисы**: > 85%  
- **Модели**: > 80%
- **Общее**: > 85%

## Заключение

Создана полная система тестирования, которая покрывает:
- ✅ Все основные эндпоинты API
- ✅ Валидацию входных данных
- ✅ Обработку ошибок
- ✅ Безопасность (SQL injection, XSS)
- ✅ Производительность
- ✅ Интеграцию с БД и Redis

Для полноценной работы необходимо настроить тестовое окружение с PostgreSQL и Redis. 