<template>
  <nav class="navigation">
    <!-- Навигация скрыта -->
  </nav>
</template>

<script setup lang="ts">
interface Props {
  currentPage: string
}

defineProps<Props>()
defineEmits<{
  changePage: [page: string]
}>()
</script>

<style scoped>
.navigation {
  margin-bottom: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style> 