import { db } from '../database/connection';
import { UrlEntity, ClickEntry } from '../types/url.types';

export class UrlModel {
  private tableName = 'urls';
  private clicksTableName = 'clicks';

  async create(urlData: UrlEntity): Promise<void> {
    await db(this.tableName).insert({
      id: urlData.id,
      original_url: urlData.originalUrl,
      short_url: urlData.shortUrl,
      alias: urlData.alias,
      created_at: urlData.createdAt,
      expires_at: urlData.expiresAt,
      click_count: urlData.clickCount
    });
  }

  async findByShortUrl(shortUrl: string): Promise<UrlEntity | undefined> {
    const result = await db(this.tableName)
      .where('short_url', shortUrl)
      .first();

    if (!result) {
      return undefined;
    }

    // Проверяем, не истекла ли ссылка
    if (result.expires_at && new Date() > new Date(result.expires_at)) {
      await this.deleteByShortUrl(shortUrl);
      return undefined;
    }

    return this.mapToEntity(result);
  }

  async findByAlias(alias: string): Promise<UrlEntity | undefined> {
    const result = await db(this.tableName)
      .where('alias', alias)
      .first();

    if (!result) {
      return undefined;
    }

    // Проверяем, не истекла ли ссылка
    if (result.expires_at && new Date() > new Date(result.expires_at)) {
      await this.deleteByShortUrl(result.short_url);
      return undefined;
    }

    return this.mapToEntity(result);
  }

  async incrementClickCount(shortUrl: string): Promise<void> {
    await db(this.tableName)
      .where('short_url', shortUrl)
      .increment('click_count', 1);
  }

  // Новый метод для batch обновления счетчиков
  async batchIncrementClickCount(clicks: Array<{ shortUrl: string; count?: number }>): Promise<void> {
    const trx = await db.transaction();
    
    try {
      for (const click of clicks) {
        await trx(this.tableName)
          .where('short_url', click.shortUrl)
          .increment('click_count', click.count || 1);
      }
      
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getAllUrls(): Promise<UrlEntity[]> {
    // Сначала удаляем истекшие ссылки
    await this.deleteExpiredUrls();

    const results = await db(this.tableName)
      .select('*')
      .orderBy('created_at', 'desc');

    return results.map(result => this.mapToEntity(result));
  }

  // Метод для удаления ссылки по shortUrl
  async deleteByShortUrl(shortUrl: string): Promise<boolean> {
    const trx = await db.transaction();
    
    try {
      // Получаем ID ссылки
      const urlData = await trx(this.tableName)
        .where('short_url', shortUrl)
        .first();
      
      if (!urlData) {
        await trx.rollback();
        return false;
      }
      
      // Удаляем статистику кликов по url_id (внешний ключ с CASCADE должен сделать это автоматически)
      // Но для надежности удаляем явно
      await trx(this.clicksTableName)
        .where('url_id', urlData.id)
        .del();
      
      // Затем удаляем саму ссылку
      const deletedRows = await trx(this.tableName)
        .where('short_url', shortUrl)
        .del();
      
      await trx.commit();
      return deletedRows > 0;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }



  private async deleteExpiredUrls(): Promise<void> {
    await db(this.tableName)
      .where('expires_at', '<', new Date())
      .del();
  }

  private mapToEntity(dbRow: any): UrlEntity {
    return {
      id: dbRow.id,
      originalUrl: dbRow.original_url,
      shortUrl: dbRow.short_url,
      alias: dbRow.alias,
      createdAt: new Date(dbRow.created_at),
      expiresAt: dbRow.expires_at ? new Date(dbRow.expires_at) : undefined,
      clickCount: dbRow.click_count
    };
  }
} 