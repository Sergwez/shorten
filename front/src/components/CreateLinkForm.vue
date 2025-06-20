<template>
  <div class="create-link-form">
    <div class="url-form">
      <div class="input-group">
        <input
          v-model="originalUrl"
          type="url"
          placeholder="https://example.com"
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
      
      <div v-if="validationError" class="validation-error">
        {{ validationError }}
      </div>
      
      <div v-if="lastCreatedLink" class="success-message">
        <div class="success-content">
          <div class="success-text">Ссылка создана!</div>
          <div class="link-container">
            <a :href="fullShortUrl" target="_blank" class="created-link">
              {{ fullShortUrl }}
            </a>
            <button @click="copyToClipboard(fullShortUrl, $event)" class="btn btn-copy">
              📋 Копировать
            </button>
          </div>
          
          <!-- Кнопки навигации к новым страницам -->
          <NavigationButtons :buttons="navigationButtons" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { validateUrl, type ShortLink } from '../types/validation'
import { apiService, type CreateUrlResponse } from '../services/api.service'
import { API_CONFIG } from '../config/env'
import NavigationButtons from './NavigationButtons.vue'

const router = useRouter()

const originalUrl = ref('')
const validationError = ref('')
const isValidating = ref(false)
const lastCreatedLink = ref<CreateUrlResponse | null>(null)

const isUrlValid = computed(() => {
  if (!originalUrl.value) return true
  const result = validateUrl(originalUrl.value)
  return result.success
})

// Создаем полную ссылку для отображения и копирования
const fullShortUrl = computed(() => {
  if (!lastCreatedLink.value) return ''
  return `${API_CONFIG.BASE_URL}/${lastCreatedLink.value.shortUrl}`
})

const navigationButtons = computed(() => [
  {
    type: 'info' as const,
    text: 'Информация',
    action: goToInfo
  },
  {
    type: 'analytics' as const,
    text: 'Аналитика',
    action: goToAnalytics
  }
])

const createShortUrl = async () => {
  if (!originalUrl.value) {
    validationError.value = 'Введите URL'
    return
  }

  isValidating.value = true
  validationError.value = ''
  lastCreatedLink.value = null

  const validation = validateUrl(originalUrl.value)
  
  if (!validation.success) {
    validationError.value = validation.error || 'Некорректный URL'
    isValidating.value = false
    return
  }

  try {
    // Отправляем запрос на бэкенд
    const response = await apiService.createShortUrl({
      originalUrl: originalUrl.value
    })

    // Сохраняем ссылку локально для отображения истории
    const newLink: ShortLink = {
      id: generateId(),
      originalUrl: response.originalUrl,
      shortUrl: `${API_CONFIG.BASE_URL}/${response.shortUrl}`,
      createdAt: new Date(response.createdAt),
      clicks: 0
    }

    saveLink(newLink)
    
    lastCreatedLink.value = response
    originalUrl.value = ''
    validationError.value = ''
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : 'Произошла ошибка при создании ссылки'
    console.error('Ошибка создания ссылки:', error)
  } finally {
    isValidating.value = false
  }
}

const copyToClipboard = async (text: string, event: Event) => {
  try {
    await navigator.clipboard.writeText(text)
    // Показываем более красивое уведомление
    const button = event?.target as HTMLButtonElement
    if (button) {
      const originalText = button.textContent
              button.textContent = 'Скопировано!'
      button.style.background = '#28a745'
      setTimeout(() => {
        button.textContent = originalText
        button.style.background = ''
      }, 2000)
    }
  } catch (err) {
    console.error('Ошибка при копировании:', err)
    alert('Не удалось скопировать ссылку')
  }
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}



// Функция для сохранения ссылки
const saveLink = (link: ShortLink) => {
  try {
    const saved = localStorage.getItem('shortLinks')
    const links = saved ? JSON.parse(saved) : []
    links.unshift(link)
    localStorage.setItem('shortLinks', JSON.stringify(links))
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error)
  }
}

// Функции навигации
const goToInfo = () => {
  if (lastCreatedLink.value) {
    router.push(`/info/${lastCreatedLink.value.shortUrl}`)
  }
}

const goToAnalytics = () => {
  if (lastCreatedLink.value) {
    router.push(`/analytics/${lastCreatedLink.value.shortUrl}`)
  }
}
</script>

<style scoped>
.create-link-form {
  max-width: 800px;
  margin: 0 auto;
}

.stats-link-container {
  margin-top: 1.5rem;
  text-align: center;
}

.stats-link {
  color: white;
  font-size: 0.9rem;
  font-weight: 400;
  text-decoration: none;
  opacity: 0.8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stats-link:hover {
  opacity: 1;
  text-decoration: underline;
  transform: translateY(-1px);
}

.success-message {
  margin-top: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(10px);
}

.success-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-text {
  color: #155724;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.link-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(40, 167, 69, 0.05);
  border: 1px solid rgba(40, 167, 69, 0.2);
  border-radius: 8px;
  flex-wrap: wrap;
}

.created-link {
  color: #155724;
  text-decoration: none;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: rgba(40, 167, 69, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(40, 167, 69, 0.2);
  flex: 1;
  min-width: 200px;
  word-break: break-all;
}

.created-link:hover {
  background: rgba(40, 167, 69, 0.15);
  border-color: rgba(40, 167, 69, 0.3);
}

.btn-copy {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-copy:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-copy:active {
  transform: translateY(0);
}



@media (max-width: 768px) {
  .link-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .created-link {
    min-width: auto;
    text-align: center;
  }
  

}
</style> 