<template>
  <div class="info-page">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Загружаем информацию о ссылке...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h2>Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="loadUrlInfo" class="action-btn primary">
        Попробовать снова
      </button>
              <button class="action-btn secondary">
          На главную
        </button>
    </div>

    <div v-else-if="urlInfo" class="info-container">
      <div class="main-info">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Сокращенная ссылка</div>
            <div class="info-value short-url">
              <a :href="fullShortUrl" target="_blank">
                {{ fullShortUrl }}
              </a>
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">Оригинальная ссылка</div>
            <div class="info-value original-url">
              <a :href="urlInfo.originalUrl" target="_blank">
                {{ urlInfo.originalUrl }}
              </a>
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">Дата создания</div>
            <div class="info-value">{{ formatDate(urlInfo.createdAt) }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">Количество переходов</div>
            <div class="info-value click-count">{{ urlInfo.clickCount }}</div>
          </div>
        </div>
        
        <ActionButtons :buttons="actionButtons" />
      </div>
    </div>
    
    <ConfirmModal
      :is-visible="showDeleteModal"
      title="Удаление ссылки"
      message="Вы уверены, что хотите удалить эту ссылку? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      loading-text="Удаляем..."
      :is-loading="isDeleting"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />
    

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiService, type UrlInfoResponse, NotFoundError } from '../services/api.service'
import { API_CONFIG } from '../config/env'
import ConfirmModal from '../components/ConfirmModal.vue'
import ActionButtons from '../components/ActionButtons.vue'

interface Props {
  shortUrl: string
}

const props = defineProps<Props>()
const router = useRouter()

const urlInfo = ref<UrlInfoResponse | null>(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)

const fullShortUrl = computed(() => {
  return `${API_CONFIG.BASE_URL}/${props.shortUrl}`
})

const actionButtons = computed(() => [
  {
    type: 'analytics' as const,
    text: 'Аналитика',
    action: goToAnalytics
  },
  {
    type: 'danger' as const,
    text: 'Удалить',
    loadingText: 'Удаляем...',
    loading: isDeleting.value,
    disabled: isDeleting.value,
    action: deleteUrl
  }
])

const loadUrlInfo = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const info = await apiService.getUrlInfo(props.shortUrl)
    urlInfo.value = info
  } catch (err) {
    console.error('Ошибка загрузки информации о ссылке:', err)
    
    // Если ссылка не найдена, редиректим на 404
    if (err instanceof NotFoundError) {
      router.push({ name: 'NotFound', query: { message: 'Короткая ссылка не найдена или была удалена.' } })
      return
    }
    
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке информации'
  } finally {
    isLoading.value = false
  }
}



const goToAnalytics = () => {
  router.push(`/analytics/${props.shortUrl}`)
}

const deleteUrl = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  showDeleteModal.value = false
  isDeleting.value = true
  
  try {
    await apiService.deleteShortUrl(props.shortUrl)
    
    // Удаляем из localStorage
    const saved = localStorage.getItem('shortLinks')
    if (saved) {
      const localLinks = JSON.parse(saved)
      const filteredLinks = localLinks.filter((link: any) => 
        !link.shortUrl.includes(props.shortUrl)
      )
      localStorage.setItem('shortLinks', JSON.stringify(filteredLinks))
    }
    
    // Сразу переходим на главную после успешного удаления
    goHome()
  } catch (error) {
    console.error('Ошибка удаления ссылки:', error)
    alert(error instanceof Error ? error.message : 'Произошла ошибка при удалении ссылки')
  } finally {
    isDeleting.value = false
  }
}

const goHome = () => {
  router.push('/')
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadUrlInfo()
})
</script>

<style scoped>
.info-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  background-attachment: fixed;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(139, 92, 246, 0.2);
  border-top: 5px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state h2 {
  color: #ef4444;
  margin: 0;
}

.info-container {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 24px;
  padding: 0;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  overflow: hidden;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

/* Main Info Section */
.main-info {
  padding: 2rem;
}

.info-grid {
  display: grid;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.info-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.info-value {
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: 500;
  word-break: break-all;
}

.info-value.short-url a {
  color: #60a5fa;
  text-decoration: none;
  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  transition: all 0.2s ease;
}

.info-value.short-url a:hover {
  color: #93c5fd;
  border-bottom-color: rgba(147, 197, 253, 0.5);
}

.info-value.original-url a {
  color: #10b981;
  text-decoration: none;
  border-bottom: 1px solid rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
}

.info-value.original-url a:hover {
  color: #34d399;
  border-bottom-color: rgba(52, 211, 153, 0.5);
}

.info-value.click-count {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}



/* Responsive Design */
@media (max-width: 768px) {
  .info-page {
    padding: 0;
    margin: 0;
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    max-width: none;
    width: 100vw;
  }
  
  .info-container {
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
    max-width: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .main-info {
    padding: 1.5rem 1rem;
  }
  
  .info-item {
    padding: 1.25rem;
    border-radius: 12px;
  }
  

  
  .info-grid {
    gap: 1.5rem;
    max-width: none;
    width: 100%;
  }
  
  .info-value {
    font-size: 1rem;
    line-height: 1.5;
  }
}

@media (max-width: 480px) {
  .info-page {
    padding: 0;
    margin: 0;
    height: 100vh;
    overflow-y: auto;
    max-width: none;
    width: 100vw;
  }
  
  .info-container {
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    max-width: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .main-info {
    padding: 1.25rem 1rem;
  }
  
  .info-item {
    padding: 1rem;
    border-radius: 8px;
  }
  

  
  .info-grid {
    gap: 1rem;
    max-width: none;
    width: 100%;
  }
  
  .info-label {
    font-size: 0.7rem;
    margin-bottom: 0.75rem;
  }
  
  .info-value {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .info-value.click-count {
    font-size: 1.5rem;
  }
  
  /* Улучшенная читаемость ссылок на мобильных */
  .info-value.short-url a,
  .info-value.original-url a {
    word-break: break-all;
    line-height: 1.4;
    display: block;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 2px solid;
  }
  
  .info-value.short-url a {
    border-bottom-color: #10b981;
  }
  
  .info-value.original-url a {
    border-bottom-color: #60a5fa;
  }
}

/* Улучшения для очень маленьких экранов */
@media (max-width: 320px) {
  .info-page {
    padding: 0;
    margin: 0;
    max-width: none;
    width: 100vw;
  }
  
  .info-container {
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    max-width: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .main-info {
    padding: 1rem 0.75rem;
  }
  
  .info-item {
    padding: 0.75rem;
  }
  
  .info-value {
    font-size: 0.85rem;
  }
  
  .info-value.click-count {
    font-size: 1.25rem;
  }
}
</style> 