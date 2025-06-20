<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>
      </div>
      
      <div class="modal-footer">
        <ActionButtons :buttons="modalButtons" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted, computed } from 'vue'
import ActionButtons from './ActionButtons.vue'

interface Props {
  isVisible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение',
  message: 'Вы уверены?',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  loadingText: 'Загрузка...',
  isLoading: false
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const closeModal = () => {
  emit('close')
}

const confirmAction = () => {
  emit('confirm')
}

const modalButtons = computed(() => {
  const buttons = []
  
  if (props.cancelText) {
    buttons.push({
      type: 'secondary' as const,
      text: props.cancelText,
      action: closeModal
    })
  }
  
  buttons.push({
    type: 'danger' as const,
    text: props.confirmText,
    loadingText: props.loadingText,
    loading: props.isLoading,
    disabled: props.isLoading,
    action: confirmAction
  })
  
  return buttons
})

const handleOverlayClick = () => {
  closeModal()
}

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscKey)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleEscKey)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: rgba(30, 30, 35, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  min-width: 320px;
  max-width: 500px;
  width: 100%;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.4s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-message {
  margin: 0;
  color: #f3f4f6;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-footer {
  padding: 0 1.5rem 1.5rem;
}

.modal-footer :deep(.bottom-actions) {
  padding: 0;
  justify-content: flex-end;
  gap: 0.75rem;
}



/* Mobile styles */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    min-width: auto;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 1rem 1rem 0;
  }
  
  .modal-title {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 0.75rem 1rem;
  }
  
  .modal-footer {
    padding: 0 1rem 1rem;
  }
  
  .modal-footer :deep(.bottom-actions) {
    flex-direction: column-reverse;
    gap: 0.5rem;
    padding: 0;
  }
}
</style> 