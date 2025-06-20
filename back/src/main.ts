import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import urlRoutes from './routes/url.routes';
import { errorHandler, notFoundHandler } from './middleware/middleware';
import { Routes } from './enums/routes.enum';
import { db } from './database/connection';
import { connectRedis } from './cache/redis.client';
import { UrlService } from './services/url.service';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.config';

// Простая загрузка .env файла
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim();
      }
    });
    console.log('.env file loaded successfully');
  } else {
    console.log('.env file not found, using default environment variables');
  }
}

// Загружаем переменные из .env
loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка для правильного получения IP адресов
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check endpoint
app.get(Routes.HEALTH, (req, res): void => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  });
});

// Routes
app.use('/', urlRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  try {
    await db.raw('SELECT 1');
    await connectRedis();
    
    const urlService = new UrlService();
    await urlService.warmupCache();
    
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
});

export default app; 