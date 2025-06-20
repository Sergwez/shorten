export interface CreateUrlRequest {
  originalUrl: string;
  expiresAt?: string;
  alias?: string;
}

export interface CreateUrlResponse {
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UrlInfoResponse {
  originalUrl: string;
  createdAt: string;
  clickCount: number;
}

export interface UrlAnalyticsResponse {
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  clickCount: number;
  recentClicks: ClickEntry[];
}

export interface ClickEntry {
  timestamp: string;
  ipAddress: string;
}

export interface DeleteUrlResponse {
  message: string;
}

export interface ApiError {
  error: string;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

import { API_CONFIG } from '../config/env';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  async createShortUrl(data: CreateUrlRequest): Promise<CreateUrlResponse> {
    const response = await fetch(`${this.baseUrl}/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to create short URL');
    }

    return response.json();
  }

  async getUrlInfo(shortUrl: string): Promise<UrlInfoResponse> {
    // Извлекаем только короткий код из полного URL
    const shortCode = shortUrl.includes('/') ? shortUrl.split('/').pop() : shortUrl;
    
    const response = await fetch(`${this.baseUrl}/info/${shortCode}`);
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      if (response.status === 404) {
        throw new NotFoundError(errorData.error || 'Short URL not found');
      }
      throw new Error(errorData.error || 'Failed to get URL info');
    }

    return response.json();
  }

  async deleteShortUrl(shortUrl: string): Promise<DeleteUrlResponse> {
    // Извлекаем только короткий код из полного URL
    const shortCode = shortUrl.includes('/') ? shortUrl.split('/').pop() : shortUrl;
    
    const response = await fetch(`${this.baseUrl}/delete/${shortCode}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to delete short URL');
    }

    return response.json();
  }

  async getUrlAnalytics(shortUrl: string): Promise<UrlAnalyticsResponse> {
    // Извлекаем только короткий код из полного URL
    const shortCode = shortUrl.includes('/') ? shortUrl.split('/').pop() : shortUrl;
    
    const response = await fetch(`${this.baseUrl}/analytics/${shortCode}`);
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      if (response.status === 404) {
        throw new NotFoundError(errorData.error || 'Short URL not found');
      }
      throw new Error(errorData.error || 'Failed to get URL analytics');
    }

    return response.json();
  }

  // Метод для получения всех ссылок пользователя из localStorage
  // Поскольку бэкенд не имеет авторизации, будем получать информацию
  // о каждой ссылке по отдельности
  async getAllUserLinks(): Promise<(UrlInfoResponse & { shortUrl: string })[]> {
    try {
      const saved = localStorage.getItem('shortLinks');
      if (!saved) return [];

      const localLinks = JSON.parse(saved);
      const linksWithInfo: (UrlInfoResponse & { shortUrl: string })[] = [];

      // Получаем актуальную информацию о каждой ссылке с сервера
      for (const localLink of localLinks) {
        try {
          const shortCode = localLink.shortUrl.includes('/') 
            ? localLink.shortUrl.split('/').pop() 
            : localLink.shortUrl;
          
          const serverInfo = await this.getUrlInfo(shortCode);
          linksWithInfo.push({
            ...serverInfo,
            shortUrl: localLink.shortUrl // Сохраняем полный URL для отображения
          });
        } catch (error) {
          console.warn(`Failed to get info for ${localLink.shortUrl}:`, error);
          // Если не удалось получить данные с сервера, используем локальные
          linksWithInfo.push({
            originalUrl: localLink.originalUrl,
            createdAt: localLink.createdAt,
            clickCount: localLink.clicks || 0,
            shortUrl: localLink.shortUrl
          });
        }
      }

      return linksWithInfo;
    } catch (error) {
      console.error('Failed to get user links:', error);
      return [];
    }
  }
}

export const apiService = new ApiService(); 