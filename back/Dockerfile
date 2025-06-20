# Используем официальный образ Node.js LTS
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# НЕ удаляем dev зависимости - они нужны для миграций
# RUN npm prune --production

# Открываем порт для приложения
EXPOSE 3000

# Запускаем приложение с миграциями через npm скрипт
CMD ["npm", "run", "start:production"] 