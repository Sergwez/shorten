<template>
  <div class="bottom-actions">
    <button 
      v-for="button in buttons" 
      :key="button.type"
      @click="button.action"
      :class="['action-btn', button.type]"
      :disabled="button.disabled"
    >
      <span v-if="button.loading">{{ button.loadingText }}</span>
      <span v-else>{{ button.text }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface ActionButton {
  type: 'analytics' | 'info' | 'danger' | 'secondary' | 'primary'
  text: string
  loadingText?: string
  loading?: boolean
  disabled?: boolean
  action: () => void
}

interface Props {
  buttons: ActionButton[]
}

defineProps<Props>()
</script>

<style scoped>
/* Bottom Actions */
.bottom-actions {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}

.action-btn {
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

.action-btn.analytics {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.action-btn.analytics:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
}

.action-btn.info {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}

.action-btn.info:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.4);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
}

.action-btn.danger:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.action-btn.primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 25px rgba(139, 92, 246, 0.4);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .bottom-actions {
    padding: 1.25rem 1rem;
    gap: 0.75rem;
  }
  
  .action-btn {
    padding: 0.875rem 1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .bottom-actions {
    padding: 1rem;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.75rem 0.75rem;
    font-size: 0.8rem;
    min-height: 44px;
  }
}

@media (max-width: 320px) {
  .bottom-actions {
    padding: 0.75rem;
    gap: 0.5rem;
    flex-direction: column;
  }
  
  .action-btn {
    padding: 0.75rem;
    font-size: 0.8rem;
    min-height: 42px;
  }
}
</style> 