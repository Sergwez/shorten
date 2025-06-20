<template>
  <div class="short-links">
    <div class="url-form">
      <div class="input-group">
        <input
          v-model="originalUrl"
          type="url"
          placeholder="Введите URL для сокращения (https://example.com)"
          class="url-input"
          :class="{ 
            'input-error': validationError && originalUrl, 
            'input-valid': isUrlValid && originalUrl 
          }"
          @keyup.enter="createShortUrl"
          @input="validationError = ''"
        />
        <button 
          @click="createShortUrl" 
          class="btn btn-primary" 
          :disabled="!originalUrl || isValidating"
        >
          <span v-if="isValidating">Проверка...</span>
          <span v-else>Создать</span>
        </button>
      </div>
      
      <!-- Отображение ошибок валидации -->
      <div v-if="validationError" class="validation-error">
        {{ validationError }}
      </div>
      
      <!-- Подсказка для пользователя -->
      <div v-if="!originalUrl" class="validation-hint">
        Поддерживаются URL, начинающиеся с http:// или https://
      </div>
    </div>

    <div v-if="links.length > 0" class="links-container">
      <div class="links-header">
        <h2>Ваши короткие ссылки ({{ links.length }})</h2>
        <button @click="clearAllLinks" class="btn btn-clear">
          Очистить все
        </button>
      </div>
      <div class="links-list">
        <div
          v-for="link in links"
          :key="link.id"
          class="link-item"
        >
          <div class="link-info">
            <div class="original-url">
              <strong>Исходный URL:</strong>
              <a :href="link.originalUrl" target="_blank">{{ link.originalUrl }}</a>
            </div>
            <div class="short-url">
              <strong>Короткая ссылка:</strong>
              <a :href="link.shortUrl" target="_blank" class="short-link">{{ link.shortUrl }}</a>
              <button @click="copyToClipboard(link.shortUrl)" class="btn btn-copy">
                Копировать
              </button>
            </div>
            <div class="link-stats">
              <span>Создана: {{ formatDate(link.createdAt) }}</span>
              <span>Переходов: {{ link.clicks }}</span>
            </div>
          </div>
          <button @click="deleteLink(link.id)" class="btn btn-danger">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <div v-if="links.length === 0" class="empty-state">
      <p>У вас пока нет коротких ссылок. Создайте первую!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { validateUrl, validateShortLink, type ShortLink } from '../types/validation'

const originalUrl = ref('')
const links = ref<ShortLink[]>([])
const validationError = ref('')
const isValidating = ref(false)

// Вычисляемое свойство для проверки валидности URL в реальном времени
const isUrlValid = computed(() => {
  if (!originalUrl.value) return true
  const result = validateUrl(originalUrl.value)
  return result.success
})

// Функция для создания короткой ссылки с валидацией
const createShortUrl = () => {
  if (!originalUrl.value) {
    validationError.value = 'Введите URL'
    return
  }

  isValidating.value = true
  validationError.value = ''

  // Валидация URL с помощью Zod
  const validation = validateUrl(originalUrl.value)
  
  if (!validation.success) {
    validationError.value = validation.error || 'Некорректный URL'
    isValidating.value = false
    return
  }

  try {
    const newLink: ShortLink = {
      id: generateId(),
      originalUrl: originalUrl.value,
      shortUrl: `https://short.ly/${generateShortCode()}`,
      createdAt: new Date(),
      clicks: 0
    }

    // Дополнительная валидация созданного объекта
    const linkValidation = validateShortLink(newLink)
    
    if (!linkValidation.success) {
      validationError.value = linkValidation.error || 'Ошибка создания ссылки'
      isValidating.value = false
      return
    }

    links.value.unshift(newLink)
    originalUrl.value = ''
    validationError.value = ''
    saveToLocalStorage()
  } catch (error) {
    validationError.value = 'Произошла ошибка при создании ссылки'
    console.error('Ошибка создания ссылки:', error)
  } finally {
    isValidating.value = false
  }
}

// Функция для удаления ссылки
const deleteLink = (id: string) => {
  links.value = links.value.filter(link => link.id !== id)
  saveToLocalStorage()
}

// Функция для очистки всех ссылок
const clearAllLinks = () => {
  if (links.value.length === 0) return
  
  if (confirm(`Вы уверены, что хотите удалить все ${links.value.length} ссылок? Это действие нельзя отменить.`)) {
    links.value = []
    saveToLocalStorage()
  }
}

// Функция для копирования в буфер обмена
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Ссылка скопирована в буфер обмена!')
  } catch (err) {
    console.error('Ошибка при копировании:', err)
  }
}

// Вспомогательные функции
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

const generateShortCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Функции для работы с localStorage
const saveToLocalStorage = () => {
  try {
    localStorage.setItem('shortLinks', JSON.stringify(links.value))
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('shortLinks')
    if (saved) {
      const parsedData = JSON.parse(saved)
      const validatedLinks: ShortLink[] = []
      
      for (const item of parsedData) {
        // Преобразуем дату из строки
        const linkWithDate = {
          ...item,
          createdAt: new Date(item.createdAt)
        }
        
        // Валидируем каждую ссылку с помощью Zod
        const validation = validateShortLink(linkWithDate)
        
        if (validation.success && validation.data) {
          validatedLinks.push(validation.data)
        } else {
          console.warn('Невалидная ссылка в localStorage:', item, validation.error)
        }
      }
      
      links.value = validatedLinks
      console.log(`Загружено ${validatedLinks.length} валидных ссылок из ${parsedData.length}`)
    }
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error)
    // В случае ошибки очищаем поврежденные данные
    localStorage.removeItem('shortLinks')
  }
}

// Загружаем данные при монтировании компонента
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.short-links {
  max-width: 800px;
  margin: 0 auto;
}
</style> 