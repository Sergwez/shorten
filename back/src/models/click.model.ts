import { db } from '../database/connection'

export interface Click {
  id: number
  url_id: string
  ip_address: string
  clicked_at: string
}

export interface CreateClickData {
  url_id: string
  ip_address: string
}

export class ClickModel {
  // Записать новый клик
  static async create(data: CreateClickData): Promise<Click> {
    try {
          const [click] = await db('clicks')
      .insert({
        url_id: data.url_id,
        ip_address: data.ip_address
      })
      .returning('*')
      
      return click
    } catch (error) {
      console.error('Ошибка создания клика:', error)
      throw new Error('Не удалось записать клик')
    }
  }

  // Получить количество кликов для URL
  static async getClickCount(urlId: string): Promise<number> {
    try {
      const result = await db('clicks')
        .where('url_id', urlId)
        .count('id as count')
        .first()
      
      return Number(result?.count || 0)
    } catch (error) {
      console.error('Ошибка получения количества кликов:', error)
      return 0
    }
  }

  // Получить последние клики для URL
  static async getRecentClicks(urlId: string, limit: number = 5): Promise<Click[]> {
    try {
      const clicks = await db('clicks')
        .where('url_id', urlId)
        .orderBy('clicked_at', 'desc')
        .limit(limit)
        .select('*')
      
      return clicks
    } catch (error) {
      console.error('Ошибка получения последних кликов:', error)
      return []
    }
  }

  // Получить клики по дням для графика
  static async getClicksByDate(urlId: string, days: number = 7): Promise<{date: string, count: number}[]> {
    try {
      const result = await db('clicks')
        .where('url_id', urlId)
        .where('clicked_at', '>=', db.raw(`NOW() - INTERVAL '${days} days'`))
        .select(db.raw('DATE(clicked_at) as date'), db.raw('COUNT(*) as count'))
        .groupBy(db.raw('DATE(clicked_at)'))
        .orderBy('date', 'asc')
      
      return result.map((row: any) => ({
        date: row.date,
        count: Number(row.count)
      }))
    } catch (error) {
      console.error('Ошибка получения кликов по дням:', error)
      return []
    }
  }

  // Получить уникальные IP-адреса для URL
  static async getUniqueIPs(urlId: string): Promise<string[]> {
    try {
      const result = await db('clicks')
        .where('url_id', urlId)
        .distinct('ip_address')
        .pluck('ip_address')
      
      return result
    } catch (error) {
      console.error('Ошибка получения уникальных IP:', error)
      return []
    }
  }

  // Получить все клики для URL (для экспорта)
  static async getAllClicks(urlId: string): Promise<Click[]> {
    try {
      const clicks = await db('clicks')
        .where('url_id', urlId)
        .orderBy('clicked_at', 'desc')
        .select('*')
      
      return clicks
    } catch (error) {
      console.error('Ошибка получения всех кликов:', error)
      return []
    }
  }

  // Удалить все клики для URL
  static async deleteByUrlId(urlId: string): Promise<boolean> {
    try {
      await db('clicks')
        .where('url_id', urlId)
        .del()
      
      return true
    } catch (error) {
      console.error('Ошибка удаления кликов:', error)
      return false
    }
  }
} 