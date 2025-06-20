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

# Удаляем dev зависимости для уменьшения размера образа
RUN npm prune --production

# Открываем порт для приложения
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"] 