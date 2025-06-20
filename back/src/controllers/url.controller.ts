import { Request, Response } from 'express';
import { UrlService } from '../services/url.service';
import { CreateUrlRequest } from '../types/create-url.types';

export class UrlController {
  private urlService = new UrlService();

  // Простое получение IP адреса
  private getClientIp = (req: Request): string => {
    return req.get('x-forwarded-for')?.split(',')[0].trim() || 
           req.ip || 
           'unknown';
  }

  // POST /shorten - создание короткой ссылки
  createShortUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { originalUrl, expiresAt, alias }: CreateUrlRequest = req.body;

      if (!originalUrl) {
        res.status(400).json({
          error: 'originalUrl is required'
        });
        return;
      }

      const result = await this.urlService.createShortUrl({
        originalUrl,
        expiresAt,
        alias
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /{shortUrl} - переадресация на оригинальный URL
  redirectToOriginal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const clientIp = this.getClientIp(req);
      
      const originalUrl = await this.urlService.getOriginalUrl(shortUrl, clientIp);
      
      res.redirect(302, originalUrl);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Short URL not found'
      });
    }
  }

  // GET /info/{shortUrl} - получение информации о ссылке
  getUrlInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const urlInfo = await this.urlService.getUrlInfo(shortUrl);
      
      res.json(urlInfo);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Short URL not found'
      });
    }
  }

  // DELETE /delete/{shortUrl} - удаление короткой ссылки
  deleteShortUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      await this.urlService.deleteShortUrl(shortUrl);
      
      res.json({
        message: 'Short URL deleted successfully'
      });
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Short URL not found'
      });
    }
  }

  // GET /analytics/{shortUrl} - получение аналитики ссылки
  getUrlAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const analytics = await this.urlService.getUrlAnalytics(shortUrl);
      
      res.json(analytics);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Short URL not found'
      });
    }
  }
} 