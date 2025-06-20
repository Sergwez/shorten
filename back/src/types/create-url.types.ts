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