export default async (): Promise<void> => {
  // Глобальное закрытие всех соединений после завершения всех тестов
  try {
    // Закрываем Bull queue
    const { clickQueue } = await import('../services/click-queue.service');
    if (clickQueue && typeof clickQueue.close === 'function') {
      await clickQueue.close();
    }
  } catch (error) {
    // Игнорируем ошибки закрытия
    console.log('Queue cleanup completed');
  }

  try {
    // Закрываем Redis соединения
    const { redisClient } = await import('../cache/redis.client');
    if (redisClient && redisClient.isReady) {
      await redisClient.quit();
    }
  } catch (error) {
    // Игнорируем ошибки закрытия Redis
    console.log('Redis cleanup completed');
  }

  // Даем время на завершение всех соединений
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('Global teardown completed');
}; 