# Примеры использования URL Shortener API

## Запуск сервера

```bash
# Режим разработки
npm run dev

# Сборка проекта
npm run build

# Запуск скомпилированного проекта
npm start
# или
node dist/index.js
```

## Тестирование API

### 1. Health Check
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/health"

# Unix/Linux/MacOS
curl http://localhost:3000/health
```

### 2. Создание короткой ссылки

#### Базовый пример
```bash
# PowerShell
$body = '{"originalUrl": "https://www.google.com"}'
Invoke-WebRequest -Uri "http://localhost:3000/shorten" -Method POST -Body $body -ContentType "application/json"

# Unix/Linux/MacOS
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'
```

#### С пользовательским алиасом
```bash
# PowerShell
$body = '{"originalUrl": "https://www.google.com", "alias": "google"}'
Invoke-WebRequest -Uri "http://localhost:3000/shorten" -Method POST -Body $body -ContentType "application/json"

# Unix/Linux/MacOS
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com", "alias": "google"}'
```

#### С датой истечения
```bash
# PowerShell
$body = '{"originalUrl": "https://www.google.com", "expiresAt": "2024-12-31T23:59:59.000Z"}'
Invoke-WebRequest -Uri "http://localhost:3000/shorten" -Method POST -Body $body -ContentType "application/json"

# Unix/Linux/MacOS
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com", "expiresAt": "2024-12-31T23:59:59.000Z"}'
```

### 3. Переход по короткой ссылке
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/abc12345" -MaximumRedirection 0

# Unix/Linux/MacOS
curl -L http://localhost:3000/abc12345
```

### 4. Получение информации о ссылке
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/info/abc12345"

# Unix/Linux/MacOS
curl http://localhost:3000/info/abc12345
```

## Примеры ответов

### Создание ссылки
```json
{
  "shortUrl": "abc12345",
  "originalUrl": "https://www.google.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### Информация о ссылке
```json
{
  "originalUrl": "https://www.google.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "clickCount": 5
}
```

### Ошибки
```json
{
  "error": "Short URL not found"
}
```

```json
{
  "error": "Invalid URL format"
}
```

```json
{
  "error": "Alias already exists"
} 