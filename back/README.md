# URL Shortener API

Сервис для создания коротких ссылок на Node.js с Express и TypeScript.

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск в продакшене
npm start
```

## API Endpoints

### 1. Создание короткой ссылки
**POST** `/shorten`

Создает короткую ссылку на основе переданного URL.

**Request Body:**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "expiresAt": "2024-12-31T23:59:59.000Z", // опционально
  "alias": "my-custom-alias" // опционально, максимум 20 символов
}
```

**Response:**
```json
{
  "shortUrl": "abc12345",
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### 2. Переадресация на оригинальный URL
**GET** `/{shortUrl}`

Переадресует пользователя на оригинальный URL и увеличивает счетчик кликов.

**Example:**
```
GET /abc12345
→ Redirect 302 to https://example.com/very/long/url
```

### 3. Получение информации о ссылке
**GET** `/info/{shortUrl}`

Возвращает информацию о сокращенной ссылке.

**Response:**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "clickCount": 42
}
```

### 4. Health Check
**GET** `/health`

Проверка состояния сервиса.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "URL Shortener"
}
```

## Особенности

- Автоматическая валидация URL
- Поддержка пользовательских алиасов (до 20 символов)
- Автоматическое истечение ссылок по дате
- Счетчик кликов для каждой ссылки
- In-memory хранилище (данные не сохраняются при перезапуске)
- Автоматическая очистка истекших ссылок

## Примеры использования

```bash
# Создание короткой ссылки
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://google.com"}'

# Получение информации о ссылке
curl http://localhost:3000/info/abc12345

# Переход по короткой ссылке
curl -L http://localhost:3000/abc12345
``` 