export interface UrlEntity {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias?: string;
  createdAt: Date;
  expiresAt?: Date;
  clickCount: number;
}

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
  shortUrl: string;
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