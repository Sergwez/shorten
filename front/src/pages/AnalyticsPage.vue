<template>
  <div class="analytics-page">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Загружаем аналитику...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h2>Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="loadAnalytics" class="btn btn-primary">
        Попробовать снова
      </button>
      <button @click="goHome" class="btn btn-secondary">
        На главную
      </button>
    </div>

    <div v-else-if="analytics" class="analytics-container">
      <div class="main-info">
        <div class="info-grid">
          <!-- Главный счетчик переходов -->
          <div class="main-stats">
            <div class="central-counter">
              <div class="counter-value">{{ analytics.clickCount }}</div>
              <div class="counter-label">Общее количество переходов</div>
            </div>
          </div>

          <!-- Таблица переходов -->
          <div v-if="analytics.recentClicks.length > 0" class="clicks-table">
            <div class="table-header">
              <div class="header-cell time">Время</div>
              <div class="header-cell ip">IP Адрес</div>
            </div>
            
            <div class="table-body">
              <div 
                v-for="(click, index) in displayedClicks" 
                :key="index"
                class="table-row"
              >
                <div class="table-cell time">
                  <div class="time-info">
                    <div class="time-value">{{ formatClickTime(click.timestamp) }}</div>
                    <div class="date-value">{{ formatClickDate(click.timestamp) }}</div>
                  </div>
                </div>
                <div class="table-cell ip">
                  <span class="ip-badge">{{ formatIpAddress(click.ipAddress) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-data-state">
            <h3>Нет данных о переходах</h3>
            <p>Поделитесь ссылкой, чтобы увидеть аналитику</p>
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
import { apiService, type UrlAnalyticsResponse, type ClickEntry, NotFoundError } from '../services/api.service'
import ConfirmModal from '../components/ConfirmModal.vue'
import ActionButtons from '../components/ActionButtons.vue'

interface Props {
  shortUrl: string
}

const props = defineProps<Props>()
const router = useRouter()

const analytics = ref<UrlAnalyticsResponse | null>(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)
const showFullHistory = ref(false)
const mockFullHistory = ref<ClickEntry[]>([])
const showDeleteModal = ref(false)

// Количество отображаемых кликов
const displayedClicks = computed(() => {
  if (!analytics.value) return []
  return showFullHistory.value ? mockFullHistory.value : analytics.value.recentClicks
})

const actionButtons = computed(() => [
  {
    type: 'info' as const,
    text: 'Информация',
    action: goToInfo
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

const loadAnalytics = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const data = await apiService.getUrlAnalytics(props.shortUrl)
    analytics.value = data
    
    // Генерируем дополнительные клики для демонстрации "полной истории"
    generateMockFullHistory(data)
  } catch (err) {
    console.error('Ошибка загрузки аналитики:', err)
    
    // Если ссылка не найдена, редиректим на 404
    if (err instanceof NotFoundError) {
      router.push({ name: 'NotFound', query: { message: 'Короткая ссылка не найдена или была удалена.' } })
      return
    }
    
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке аналитики'
  } finally {
    isLoading.value = false
  }
}

const generateMockFullHistory = (data: UrlAnalyticsResponse) => {
  const allClicks = [...data.recentClicks]
  
  // Добавляем моковые данные для демонстрации
  for (let i = 0; i < Math.max(data.clickCount - 5, 0); i++) {
    const randomDate = new Date()
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30))
    randomDate.setHours(Math.floor(Math.random() * 24))
    randomDate.setMinutes(Math.floor(Math.random() * 60))
    
    allClicks.push({
      timestamp: randomDate.toISOString(),
      ipAddress: generateRandomIP()
    })
  }
  
  // Сортируем по дате (новые сверху)
  mockFullHistory.value = allClicks.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

const generateRandomIP = (): string => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}



const goHome = () => {
  router.push('/')
}

const formatClickDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'short',
    day: 'numeric'
  })
}

const formatClickTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goToInfo = () => {
  router.push(`/info/${props.shortUrl}`)
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

const formatIpAddress = (ip: string): string => {
  // Показываем localhost как более понятное название
  if (ip === '127.0.0.1' || ip === '::1') {
    return '127.0.0.1 (localhost)'
  }
  
  // Для других IP адресов просто возвращаем как есть
  return ip
}

onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped>
.analytics-page {
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

.analytics-container {
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
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  gap: 1.25rem;
  max-width: 800px;
  margin: 0 auto;
}



/* Main Counter */
.main-stats {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.central-counter {
  max-width: 400px;
  margin: 0 auto;
}

.counter-value {
  font-size: 3.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.counter-label {
  font-size: 1.1rem;
  color: #d1d5db;
  font-weight: 500;
  letter-spacing: 0.02em;
}





.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
}

.section-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.meta-text {
  color: #9ca3af;
  font-size: 0.9rem;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn:hover {
  background: rgba(16, 185, 129, 0.3);
}

.export-icon {
  font-size: 0.9rem;
}

/* Table */
.clicks-table {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.4);
}

.header-cell {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  padding: 0.5rem 1rem;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  display: flex;
  align-items: center;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-value {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.9rem;
}

.date-value {
  color: #9ca3af;
  font-size: 0.8rem;
}

.ip-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.location-text {
  color: #a1a1aa;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* No Data State */
.no-data-state {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  padding: 2.5rem 2rem;
  color: #6b7280;
}

.no-data-state h3 {
  margin: 0 0 1rem 0;
  color: #9ca3af;
  font-weight: 600;
}

.no-data-state p {
  color: #6b7280;
  margin: 0;
}



/* Responsive Design */
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 150px 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 0;
    margin: 0;
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    max-width: none;
    width: 100vw;
  }
  
  .analytics-container {
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
  

  
  .main-stats {
    padding: 1.25rem;
    border-radius: 12px;
  }
  
  .counter-value {
    font-size: 3rem;
  }
  
  .recent-section {
    padding: 1.25rem;
    border-radius: 12px;
  }
  

  
  .info-grid {
    gap: 1.5rem;
    max-width: none;
    width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .section-meta {
    width: 100%;
    justify-content: space-between;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .table-header {
    display: none;
  }
  
  .table-row {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    border-bottom: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .table-cell {
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .table-cell:last-child {
    border-bottom: none;
  }
  
  .table-cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: #9ca3af;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .table-cell.time::before {
    content: "Время";
  }
  
  .table-cell.ip::before {
    content: "IP Адрес";
  }
  

}

@media (max-width: 480px) {
  .analytics-page {
    padding: 0;
    margin: 0;
    height: 100vh;
    overflow-y: auto;
    max-width: none;
    width: 100vw;
  }
  
  .analytics-container {
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
  

  
  .main-stats {
    padding: 1rem;
    border-radius: 8px;
  }
  
  .counter-value {
    font-size: 2.5rem;
  }
  
  .recent-section {
    padding: 1rem;
    border-radius: 8px;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
  
  .section-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .export-btn {
    align-self: flex-end;
  }
  
  .table-row {
    padding: 0.75rem;
    border-radius: 8px;
  }
  
  .table-cell {
    padding: 0.35rem 0;
  }
  
  .time-value {
    font-size: 0.85rem;
  }
  
  .date-value {
    font-size: 0.75rem;
  }
  
  .ip-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
  }
  

  
  .info-grid {
    gap: 1rem;
    max-width: none;
    width: 100%;
  }
}

/* Улучшения для очень маленьких экранов */
@media (max-width: 320px) {
  .analytics-page {
    padding: 0;
    margin: 0;
    max-width: none;
    width: 100vw;
  }
  
  .analytics-container {
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
  

  
  .main-stats {
    padding: 1rem 0.75rem;
  }
  
  .counter-value {
    font-size: 2rem;
  }
  
  .counter-label {
    font-size: 0.8rem;
  }
  
  .recent-section {
    padding: 0.75rem;
  }
  
  .table-row {
    padding: 0.5rem;
    margin-bottom: 0.75rem;
  }
  

}
</style> 