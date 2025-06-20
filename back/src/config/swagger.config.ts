import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: 'Сервис для создания коротких ссылок с аналитикой',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'URLs',
        description: 'Управление короткими ссылками'
      },
      {
        name: 'Analytics',
        description: 'Аналитика переходов'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'] // Пути к файлам с JSDoc
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; margin: 20px 0; }
  `,
  customSiteTitle: 'URL Shortener API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true
  }
}; 