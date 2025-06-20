FROM redis:7-alpine

# Redis для кеширования URL и очередей
# Использует разные DB: 0 для кеша, 1 для очередей

# Копируем кастомную конфигурацию
COPY redis.conf /usr/local/etc/redis/redis.conf

# Создаем директорию для данных
RUN mkdir -p /data

# Устанавливаем права
RUN chown redis:redis /data

# Переключаемся на пользователя redis
USER redis

# Открываем порт
EXPOSE 6379

# Запускаем Redis с кастомной конфигурацией
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"] 