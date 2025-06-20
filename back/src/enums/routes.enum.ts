// Enum для всех роутов системы для того чтобы проверять при создании короткой ссылки и не создать ссылку повторяющую существующий роут
export enum Routes {
  HEALTH = '/health',
  SHORTEN = '/shorten',
  INFO = '/info/:shortUrl',
  DELETE = '/delete/:shortUrl',
  ANALYTICS = '/analytics/:shortUrl',
  SHORT_URL = '/:shortUrl'
} 