import { z } from 'zod'

// Схема для валидации URL
export const urlSchema = z
  .string()
  .min(1, 'URL не может быть пустым')
  .url('Введите корректный URL (например: https://example.com)')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    },
    'URL должен начинаться с http:// или https://'
  )

// Схема для короткой ссылки
export const shortLinkSchema = z.object({
  id: z.string().min(1),
  originalUrl: urlSchema,
  shortUrl: z.string().url(),
  createdAt: z.date(),
  clicks: z.number().min(0)
})

// Типы, выведенные из схем
export type UrlInput = z.infer<typeof urlSchema>
export type ShortLink = z.infer<typeof shortLinkSchema>

// Функция для валидации URL
export const validateUrl = (url: string): { success: boolean; error?: string } => {
  try {
    urlSchema.parse(url)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || 'Некорректный URL' 
      }
    }
    return { success: false, error: 'Ошибка валидации' }
  }
}

// Функция для валидации короткой ссылки
export const validateShortLink = (data: unknown): { success: boolean; data?: ShortLink; error?: string } => {
  try {
    const validatedData = shortLinkSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ')
      }
    }
    return { success: false, error: 'Ошибка валидации данных' }
  }
} 