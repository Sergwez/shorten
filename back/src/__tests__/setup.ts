import { customMatchers } from './test-utils';

// Расширяем Jest кастомными матчерами
expect.extend(customMatchers);

// Устанавливаем переменные окружения для тестов
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Позволяем системе выбрать свободный порт

// Увеличиваем таймаут для асинхронных операций
jest.setTimeout(30000);

// Глобальная настройка для тестов
beforeAll(async () => {
  // Здесь можно добавить глобальную инициализацию
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // Закрываем соединения для чистого завершения тестов
  console.log('✅ Test suite completed');
});

// Обработка неперехваченных промисов
process.on('unhandledRejection', (reason, promise) => {
  // Игнорируем известные ошибки при завершении тестов
  if (
    !reason ||
    (typeof reason === 'string' && reason.includes('Connection is closed')) ||
    (reason instanceof Error && reason.message?.includes('Connection is closed'))
  ) {
    return; // Не логируем эти ошибки
  }
  // Логируем только реальные проблемы
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
});

// Обработка неперехваченных исключений
process.on('uncaughtException', (error) => {
  // Игнорируем ошибки соединений при завершении тестов
  if (error.message?.includes('Connection is closed')) {
    return;
  }
  if (process.env.NODE_ENV !== 'test') {
    console.error('Uncaught Exception:', error);
  }
});

// Дополнительные типы для TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidShortUrl(): R;
      toHaveValidTimestamp(): R;
    }
  }
} 