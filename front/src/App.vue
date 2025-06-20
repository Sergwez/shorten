<template>
  <div id="app">
    <div class="app-background">
      <div class="animated-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <AppHeader />
    
    <Navigation 
      :currentPage="currentPage" 
      @changePage="changePage" 
    />
    
    <main class="main">
      <!-- Используем router-view для правильной работы роутинга -->
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import Navigation from './components/Navigation.vue'

// Состояние текущей страницы (оставляем для совместимости с Navigation)
const currentPage = ref('home')

// Функция для переключения страниц (оставляем для совместимости с Navigation)
const changePage = (page: string) => {
  currentPage.value = page
}
</script>

<style>
/* Импорт Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Глобальные CSS переменные */
:root {
  --primary-color: #6366f1;
  --primary-light: #8b5cf6;
  --primary-dark: #4f46e5;
  --secondary-color: #ec4899;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-radius: 16px;
  --box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}

/* Глобальные стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--background-gradient);
  min-height: 100vh;
  color: var(--text-primary);
  overflow-x: hidden;
}

#app {
  height: 100vh;
  padding: 0;
  position: relative;
  backdrop-filter: blur(10px);
}

/* Анимированный фон */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.animated-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp var(--transition-slow);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 1rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для форм и контейнеров */
.url-form {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius);
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--box-shadow);
  backdrop-filter: blur(20px);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.url-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-border), transparent);
}

.input-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.url-input {
  flex: 1;
  min-width: 300px;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  transition: all var(--transition-normal);
  font-family: inherit;
}

.url-input::placeholder {
  color: var(--text-secondary);
}

.url-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.url-input.input-valid {
  border-color: var(--success-color);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.url-input.input-error {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Стили для кнопок */
.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-transform: none;
  letter-spacing: 0.025em;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-normal);
}

.btn:hover::before {
  left: 100%;
}

.btn:disabled {
  opacity: 0.6;
  transform: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.25);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-copy {
  background: var(--success-color);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  margin-left: 0.5rem;
  box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.25);
}

.btn-copy:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.35);
}

.btn-danger {
  background: var(--danger-color);
  color: white;
  padding: 0.8rem 1.2rem;
  box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.25);
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(239, 68, 68, 0.35);
}

.btn-clear {
  background: var(--text-secondary);
  color: white;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  box-shadow: 0 4px 14px 0 rgba(107, 114, 128, 0.25);
}

.btn-clear:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

/* Стили для контейнера ссылок */
.links-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: var(--box-shadow);
  backdrop-filter: blur(20px);
  transition: all var(--transition-normal);
  animation: slideInUp var(--transition-slow);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.links-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.links-container h2 {
  color: white;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  border-left: 4px solid var(--primary-color);
  transition: all var(--transition-normal);
  animation: fadeInScale 0.3s ease;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.link-item:hover {
  transform: translateX(8px) translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-left-width: 6px;
}

.link-info {
  flex: 1;
  margin-right: 1rem;
}

.original-url,
.short-url {
  margin-bottom: 0.8rem;
  transition: all var(--transition-fast);
}

.original-url strong,
.short-url strong {
  color: var(--text-primary);
  display: inline-block;
  width: 140px;
  font-size: 0.9rem;
  font-weight: 600;
}

.original-url a {
  color: var(--primary-color);
  text-decoration: none;
  word-break: break-all;
  transition: color var(--transition-fast);
}

.original-url a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.short-link {
  color: var(--success-color);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.short-link:hover {
  color: #059669;
  text-decoration: underline;
  transform: scale(1.05);
}

.link-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.validation-error {
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideInDown var(--transition-normal);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
  backdrop-filter: blur(10px);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.validation-hint {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fadeIn var(--transition-normal);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: var(--success-color);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: bounceIn var(--transition-normal);
  flex-wrap: wrap;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius);
  backdrop-filter: blur(20px);
  color: white;
  font-size: 1.1rem;
  animation: fadeIn var(--transition-slow);
}

/* Адаптивность */
@media (max-width: 768px) {
  .url-form,
  .links-container {
    padding: 1.5rem;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .url-input {
    min-width: 100%;
  }
  
  .link-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .link-info {
    margin-right: 0;
  }
  
  .original-url strong,
  .short-url strong {
    width: auto;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .links-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .success-message {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
  
  .shape {
    display: none;
  }
}

@media (max-width: 480px) {
  .url-form,
  .links-container {
    padding: 1rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .links-header {
    text-align: center;
  }
  
  .links-container h2 {
    font-size: 1.5rem;
  }
}

/* Скроллбар */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}


</style> 