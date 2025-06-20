<template>
  <div class="navigation-buttons">
    <button 
      v-for="button in buttons" 
      :key="button.type"
      @click="button.action"
      :class="['btn', `btn-${button.type}`]"
      :disabled="button.disabled"
    >
      <span v-if="button.loading">{{ button.loadingText }}</span>
      <span v-else>{{ button.text }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface NavigationButton {
  type: 'info' | 'analytics'
  text: string
  loadingText?: string
  loading?: boolean
  disabled?: boolean
  action: () => void
}

interface Props {
  buttons: NavigationButton[]
}

defineProps<Props>()
</script>

<style scoped>
.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  min-height: 48px;
}

.btn-info {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}

.btn-info:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.4);
}

.btn-analytics {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.btn-analytics:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Mobile styles */
@media (max-width: 768px) {
  .navigation-buttons {
    gap: 0.75rem;
  }
  
  .btn {
    padding: 0.875rem 1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .navigation-buttons {
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.75rem 0.75rem;
    font-size: 0.8rem;
    min-height: 44px;
  }
}

@media (max-width: 320px) {
  .navigation-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.75rem;
    font-size: 0.8rem;
    min-height: 42px;
  }
}
</style> 