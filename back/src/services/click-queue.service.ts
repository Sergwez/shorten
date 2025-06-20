import Queue from 'bull';
import { UrlModel } from '../models/url.model';

// Используем тот же Redis что и для кеша, но с другой DB
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

// Создаем очередь для обработки кликов
export const clickQueue = new Queue('click processing', {
  redis: {
    port: redisPort,
    host: redisHost,
    db: 1, // Используем DB 1 для очередей (DB 0 для кеша)
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Хранить только последние 100 выполненных задач
    removeOnFail: 50,      // Хранить только последние 50 неудачных задач
    attempts: 3,           // Максимум 3 попытки
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const urlModel = new UrlModel();

// Batch обработка для оптимизации
clickQueue.process('increment-click-batch', 5, async (job) => {
  const { clicks } = job.data; // Array of { shortUrl, count }
  
  try {
    await urlModel.batchIncrementClickCount(clicks);
          console.log(`Batch click count incremented for ${clicks.length} URLs`);
  } catch (error) {
          console.error(`Failed to batch increment click count:`, error);
    throw error;
  }
});

// Временное хранилище для группировки кликов
const clickBuffer = new Map<string, number>();
let batchTimeout: NodeJS.Timeout | null = null;

// Группируем клики и отправляем batch'ами
export const addClickToQueue = async (shortUrl: string) => {
  try {
    // Увеличиваем счетчик для данного URL
    clickBuffer.set(shortUrl, (clickBuffer.get(shortUrl) || 0) + 1);
    
    // Если нет активного таймера - запускаем batch обработку
    if (!batchTimeout) {
      batchTimeout = setTimeout(async () => {
        await flushClickBuffer();
        batchTimeout = null;
      }, 1000); // Группируем клики за 1 секунду
    }
    
    // Если буфер большой - отправляем немедленно
    if (clickBuffer.size >= 50) {
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }
      await flushClickBuffer();
    }
  } catch (error) {
    console.error('Failed to add click to queue:', error);
  }
};

// Отправляем накопленные клики в batch
const flushClickBuffer = async () => {
  if (clickBuffer.size === 0) return;
  
  const clicks = Array.from(clickBuffer.entries()).map(([shortUrl, count]) => ({
    shortUrl,
    count
  }));
  
  clickBuffer.clear();
  
  try {
    await clickQueue.add('increment-click-batch', { clicks }, {
      priority: 5, // Более высокий приоритет для batch'ей
      attempts: 5, // Больше попыток для batch'ей
    });
  } catch (error) {
    console.error('Failed to add batch clicks to queue:', error);
  }
};

export default clickQueue; 