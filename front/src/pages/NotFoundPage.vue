<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-icon">
          <div class="icon-404">404</div>
        </div>
        
        <div class="error-message">
          <h1 class="error-title">Страница не найдена</h1>
          <p class="error-description">
            {{ displayMessage }}
          </p>
        </div>
        
        <div class="error-actions">
          <ActionButtons :buttons="actionButtons" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ActionButtons from '../components/ActionButtons.vue'

interface Props {
  message?: string
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// Читаем сообщение из props или query параметров
const displayMessage = computed(() => {
  return props.message || (route.query.message as string) || 'Запрашиваемая ссылка не существует или была удалена.'
})

const goHome = () => {
  router.push('/')
}

const actionButtons = computed(() => [
  {
    type: 'primary' as const,
    text: 'На главную',
    action: goHome
  }
])
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  position: relative;
}

.not-found-container {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  text-align: center;
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 2;
}

.error-icon {
  margin-bottom: 2rem;
}

.icon-404 {
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 20px rgba(139, 92, 246, 0.3));
}

.error-message {
  margin-bottom: 3rem;
}

.error-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #ffffff, #e5e7eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-description {
  font-size: 1.1rem;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.error-actions {
  display: flex;
  justify-content: center;
}

.error-actions :deep(.bottom-actions) {
  padding: 0;
  justify-content: center;
}





/* Mobile styles */
@media (max-width: 768px) {
  .not-found-page {
    padding: 1rem;
  }
  
  .not-found-container {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  
  .icon-404 {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .error-description {
    font-size: 1rem;
  }
  
  .error-actions :deep(.bottom-actions) {
    align-items: center;
  }
  
  .error-actions :deep(.action-btn) {
    width: 100%;
    max-width: 280px;
  }
}

@media (max-width: 480px) {
  .not-found-container {
    padding: 1.5rem 1rem;
  }
  
  .icon-404 {
    font-size: 3rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-description {
    font-size: 0.9rem;
  }
}
</style> 