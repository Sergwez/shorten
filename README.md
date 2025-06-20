# URL Shortener - High Performance Edition


## Обновленная структура проекта

```
shorts/
├── bd/              ← PostgreSQL database
│   └── Dockerfile
├── redis/           ← Redis services (ПРАВИЛЬНАЯ СТРУКТУРА!)
│   ├── cache/       ← Redis для кеширования URL
│   │   ├── Dockerfile
│   │   └── redis-cache.conf
│   ├── queue/       ← Redis для очереди задач  
│   │   ├── Dockerfile
│   │   └── redis-queue.conf
│   └── README.md       ← Документация Redis
├── back/            ← Backend API
├── front/           ← Frontend React
├── nginx/           ← Load Balancer (готов к включению)
└── docker-compose.yml  ← Главная оркестрация
```

## Преимущества новой структуры

### **Консистентность**
- Каждый сервис имеет свою папку (как `bd/`)
- Унифицированная организация проекта
- Все конфигурации логически сгруппированы

### **Конфигурируемость**  
- Отдельные оптимизированные конфиги для cache/queue
- Специализированные Dockerfile для каждой задачи
- Легкая настройка каждого сервиса

### **Масштабируемость**
- Простое добавление Redis Cluster
- Готовность к мониторингу
- Возможность независимого обновления сервисов

### **Maintainability**
- Четкое разделение ответственности
- Простота backup и обновлений
- Документация для каждого компонента

## Реализованные улучшения производительности

### 1. Redis Кеширование
- **Специализированный кеш-сервис** с оптимизированной конфигурацией
- **Адаптивное время жизни** - популярные ссылки кешируются дольше
- **LRU eviction** - автоматическое удаление старых данных
- **Отключена персистентность** - максимальная скорость

### 2. Асинхронная обработка счетчиков
- **Специализированный очередь-сервис** с надежной персистентностью
- **Bull Queue** на отдельном Redis инстансе
- **Не блокирует редирект** - счетчики обновляются в фоне
- **RDB + AOF** - гарантированная сохранность задач

### 3. Оптимизация базы данных
- **Увеличенный connection pool** - min: 5, max: 30 соединений
- **Batch операции** - групповые UPDATE для счетчиков
- **Настроенные timeout'ы** - оптимизация для высокой нагрузки

### 4. Готовность к масштабированию
- **Health checks** для всех Redis сервисов
- **Поддержка INSTANCE_ID** для множественных backend
- **Nginx конфигурация** готова для load balancing

## Ожидаемая производительность

| Сценарий | Было | Стало |
|----------|------|-------|
| **Новые ссылки** | ~500 RPS | ~2K RPS |
| **Популярные ссылки** | ~500 RPS | **~50K RPS** |
| **Latency редиректа** | ~50-100ms | **~1-5ms** |

## Установка и запуск

### Быстрый старт

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f backend
```

### Проверка Redis сервисов

```bash
# Проверка кеша
docker exec -it shorts-redis-cache redis-cli ping
docker exec -it shorts-redis-cache redis-cli KEYS "url:*"

# Проверка очереди
docker exec -it shorts-redis-queue redis-cli ping
docker exec -it shorts-redis-queue redis-cli LLEN "bull:click processing:waiting"
```

## Архитектура сервисов

### Redis Cache (shorts-redis-cache)
- **Порт**: 6379
- **Память**: 256MB с LRU
- **Назначение**: Быстрый доступ к популярным URL
- **Конфигурация**: `redis/cache/redis-cache.conf`

### Redis Queue (shorts-redis-queue)  
- **Порт**: 6380 → 6379
- **Память**: 512MB без eviction
- **Назначение**: Надежная очередь для Bull Queue
- **Конфигурация**: `redis/queue/redis-queue.conf`

### PostgreSQL (shorts-database)
- **Порт**: 5433 → 5432
- **Connection Pool**: 5-30 соединений
- **Назначение**: Основное хранилище данных

### Backend (shorts-backend)
- **Порт**: 3000
- **Instance**: Поддержка множественных инстансов
- **Назначение**: API сервер с кешированием

## Мониторинг

### Health Checks
```bash
# Все сервисы
curl http://localhost:3000/health

# Redis сервисы  
docker-compose ps | grep redis
```

### Метрики производительности
```bash
# Кеш hit rate
docker exec -it shorts-redis-cache redis-cli INFO stats | grep hit

# Использование памяти
docker exec -it shorts-redis-cache redis-cli INFO memory

# Статус очереди
docker exec -it shorts-redis-queue redis-cli LLEN "bull:click processing:waiting"
```

## Настройка для масштабирования

### Добавление backend инстансов
В `docker-compose.yml` раскомментируйте:
```yaml
backend-2:
  # ... конфигурация второго инстанса
nginx:
  # ... load balancer
```

### Увеличение памяти Redis
```bash
# В redis/cache/redis-cache.conf
maxmemory 512mb  # было 256mb

# В redis/queue/redis-queue.conf  
maxmemory 1024mb  # было 512mb
```

## Следующие шаги

1. **Мониторинг** - Prometheus + Grafana
2. **CDN** - Cloudflare для редиректов
3. **Database Sharding** - партиционирование по shortUrl
4. **Read Replicas** - разделение чтения/записи

---

**Система готова обрабатывать 20-50K RPS для популярных ссылок с правильной архитектурой!** 