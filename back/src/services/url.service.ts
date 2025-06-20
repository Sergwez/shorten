import { nanoid } from 'nanoid';
import validator from 'validator';
import { UrlModel } from '../models/url.model';
import { ClickModel } from '../models/click.model';
import { UrlEntity, UrlInfoResponse, UrlAnalyticsResponse, DeleteUrlResponse } from '../types/url.types';
import { CreateUrlRequest, CreateUrlResponse } from '../types/create-url.types';
import { Routes } from '../enums/routes.enum';
import { cacheService } from './cache.service';
import { addClickToQueue } from './click-queue.service';
import { db } from '../database/connection';

export class UrlService {
  private urlModel: UrlModel;

  constructor() {
    this.urlModel = new UrlModel();
  }

  // Проверка, конфликтует ли shortUrl с существующими роутами
  private isConflictWithRoutes(shortUrl: string): boolean {
    const routeValues = Object.values(Routes);
    const reservedRoutes = routeValues.map(route => {
      return route.substring(1).split(/[\/:]/, 1)[0];
    }).filter(route => route.length > 0);
    
    return reservedRoutes.includes(shortUrl.toLowerCase());
  }

  async createShortUrl(data: CreateUrlRequest): Promise<CreateUrlResponse> {
    // Валидация URL
    if (!validator.isURL(data.originalUrl)) {
      throw new Error('Invalid URL format');
    }

    // Валидация алиаса
    if (data.alias) {
      // Проверка на конфликт с роутами
      if (this.isConflictWithRoutes(data.alias)) {
        throw new Error(`"${data.alias}" conflicts with existing system routes`);
      }
      
      // Проверка на уникальность алиаса
      if (await this.urlModel.findByAlias(data.alias)) {
        throw new Error('Alias already exists');
      }
    }

    // Валидация даты окончания действия
    let expiresAt: Date | undefined;
    if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        throw new Error('Invalid expiration date format');
      }
      if (expiresAt <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
    }

    // Генерация короткого URL с проверкой конфликтов
    let shortUrl: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortUrl = data.alias || nanoid(8);
      attempts++;
      
      // Проверка на уникальность
      if (await this.urlModel.findByShortUrl(shortUrl)) {
        if (data.alias) {
          throw new Error('Alias already exists');
        }
        continue;
      }

      // Проверка на конфликт с роутами для автогенерированных ID
      if (!data.alias && this.isConflictWithRoutes(shortUrl)) {
        continue;
      }

      break;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique short URL. Please try again.');
    }

    const urlData: UrlEntity = {
      id: nanoid(),
      originalUrl: data.originalUrl,
      shortUrl,
      alias: data.alias,
      createdAt: new Date(),
      expiresAt,
      clickCount: 0
    };

    await this.urlModel.create(urlData);

    // Сразу кешируем новую ссылку с правильным TTL
    let cacheTTL: number;
    if (expiresAt) {
      // Если у ссылки есть срок истечения, устанавливаем TTL до этого времени
      cacheTTL = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      if (cacheTTL <= 0) {
        // Ссылка уже истекла при создании - не кэшируем
        console.log(`URL ${shortUrl} created with expired date, not caching`);
      } else {
        await cacheService.set(`url:${shortUrl}`, data.originalUrl, cacheTTL);
      }
    } else {
      // Если нет срока истечения, используем стандартный TTL (1 час)
      await cacheService.set(`url:${shortUrl}`, data.originalUrl, 3600);
    }

    return {
      shortUrl,
      originalUrl: data.originalUrl,
      createdAt: urlData.createdAt.toISOString(),
      expiresAt: expiresAt?.toISOString()
    };
  }

  async getOriginalUrl(shortUrl: string, clientIp?: string): Promise<string> {
    // Сначала проверяем кеш
    const cacheKey = `url:${shortUrl}`;
    const cachedUrl = await cacheService.get(cacheKey);
    
    if (cachedUrl) {
      // Ссылка найдена в кэше и не истекла (TTL контролирует истечение)
      // Асинхронно добавляем клик в очередь
      addClickToQueue(shortUrl).catch(err => {
        console.error('Failed to queue click:', err);
      });
      
      // Асинхронно записываем статистику клика
      if (clientIp) {
        this.recordClick(shortUrl, clientIp).catch((err: any) => {
          console.error('Failed to record click:', err);
        });
      }
      
      return cachedUrl;
    }

    // Если нет в кеше - идем в БД
    const urlData = await this.urlModel.findByShortUrl(shortUrl);
    
    if (!urlData) {
      throw new Error('Short URL not found');
    }

    // Кешируем результат с правильным TTL
    if (urlData.expiresAt) {
      // Если у ссылки есть срок истечения, устанавливаем TTL до этого времени
      const cacheTTL = Math.floor((urlData.expiresAt.getTime() - Date.now()) / 1000);
      if (cacheTTL > 0) {
        await cacheService.set(cacheKey, urlData.originalUrl, cacheTTL);
      }
      // Если TTL <= 0, ссылка истекла - не кэшируем
    } else {
      // Если нет срока истечения, используем setWithPopularityBonus
      await cacheService.setWithPopularityBonus(cacheKey, urlData.originalUrl, urlData.clickCount);
    }

    // Асинхронно увеличиваем счетчик
    addClickToQueue(shortUrl).catch(err => {
      console.error('Failed to queue click:', err);
    });
    
    // Асинхронно записываем статистику клика
    if (clientIp) {
      this.recordClick(shortUrl, clientIp).catch((err: any) => {
        console.error('Failed to record click:', err);
      });
    }

    return urlData.originalUrl;
  }

  async getUrlInfo(shortUrl: string): Promise<UrlInfoResponse> {
    const urlData = await this.urlModel.findByShortUrl(shortUrl);
    
    if (!urlData) {
      throw new Error('Short URL not found');
    }

    // Получаем актуальное количество кликов из таблицы clicks
    const actualClickCount = await ClickModel.getClickCount(urlData.id);

    return {
      originalUrl: urlData.originalUrl,
      shortUrl: urlData.shortUrl,
      createdAt: urlData.createdAt.toISOString(),
      clickCount: actualClickCount // Используем актуальное количество из таблицы clicks
    };
  }

  // Метод для удаления короткой ссылки
  async deleteShortUrl(shortUrl: string): Promise<DeleteUrlResponse> {
    const deleted = await this.urlModel.deleteByShortUrl(shortUrl);
    
    if (!deleted) {
      throw new Error('Short URL not found');
    }
    
    // Удаляем из кэша
    const cacheKey = `url:${shortUrl}`;
    await cacheService.del(cacheKey);

    return {
      message: 'Short URL deleted successfully'
    };
  }

  // Метод для записи клика
  private async recordClick(shortUrl: string, ipAddress: string): Promise<void> {
    try {
      // Получаем URL данные
      const urlData = await this.urlModel.findByShortUrl(shortUrl);
      if (!urlData) {
        throw new Error('Short URL not found');
      }

      // Записываем клик в таблицу clicks
      await ClickModel.create({
        url_id: urlData.id,
        ip_address: ipAddress
      });
      
      // Также обновляем счетчик кликов в таблице urls для совместимости
      await this.urlModel.incrementClickCount(shortUrl);
      
    } catch (error) {
      console.error('Failed to record click:', error);
    }
  }

  // Метод для получения аналитики ссылки
  async getUrlAnalytics(shortUrl: string): Promise<UrlAnalyticsResponse> {
    const urlData = await this.urlModel.findByShortUrl(shortUrl);
    
    if (!urlData) {
      throw new Error('Short URL not found');
    }

    // Получаем актуальное количество кликов из таблицы clicks
    const actualClickCount = await ClickModel.getClickCount(urlData.id);
    
    // Получаем последние клики из новой таблицы clicks
    const recentClicksData = await ClickModel.getRecentClicks(urlData.id, 5);
    
    // Преобразуем в нужный формат
    const recentClicks = recentClicksData.map(click => ({
      timestamp: click.clicked_at,
      ipAddress: click.ip_address
    }));



    return {
      originalUrl: urlData.originalUrl,
      shortUrl: urlData.shortUrl,
      createdAt: urlData.createdAt.toISOString(),
      clickCount: actualClickCount, // Используем актуальное количество из таблицы clicks
      recentClicks
    };
  }

  // Метод для предварительного прогрева кеша популярных ссылок
  async warmupCache(): Promise<void> {
    console.log('Warming up cache for popular URLs...');
    
    try {
      const warmupLimit = parseInt(process.env.CACHE_WARMUP_LIMIT || '1000');
      const popularUrls = await db('urls')
        .select('short_url', 'original_url', 'click_count', 'expires_at')
        .orderBy('click_count', 'desc')
        .limit(warmupLimit);

      for (const url of popularUrls) {
        const cacheKey = `url:${url.short_url}`;
        
        if (url.expires_at) {
          // Если у ссылки есть срок истечения, устанавливаем TTL до этого времени
          const cacheTTL = Math.floor((new Date(url.expires_at).getTime() - Date.now()) / 1000);
          if (cacheTTL > 0) {
            await cacheService.set(cacheKey, url.original_url, cacheTTL);
          }
          // Если TTL <= 0, ссылка уже истекла - не кэшируем
        } else {
          // Если нет срока истечения, используем setWithPopularityBonus
          await cacheService.setWithPopularityBonus(
            cacheKey, 
            url.original_url, 
            url.click_count
          );
        }
      }
      
      console.log(`Cache warmed up with ${popularUrls.length} popular URLs`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }
} 