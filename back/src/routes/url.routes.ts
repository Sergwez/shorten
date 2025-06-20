import { Router } from 'express';
import { UrlController } from '../controllers/url.controller';
import { Routes } from '../enums/routes.enum';

const router = Router();
const urlController = new UrlController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUrlRequest:
 *       type: object
 *       required:
 *         - originalUrl
 *       properties:
 *         originalUrl:
 *           type: string
 *           format: uri
 *           description: Оригинальный URL для сокращения
 *           example: "https://example.com/very/long/url"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Дата истечения ссылки (ISO 8601)
 *           example: "2024-12-31T23:59:59.000Z"
 *         alias:
 *           type: string
 *           maxLength: 20
 *           pattern: "^[a-zA-Z0-9-_]+$"
 *           description: Пользовательский алиас (до 20 символов)
 *           example: "my-custom-alias"
 *     
 *     CreateUrlResponse:
 *       type: object
 *       properties:
 *         shortUrl:
 *           type: string
 *           description: Сгенерированная короткая ссылка
 *           example: "abc12345"
 *         originalUrl:
 *           type: string
 *           format: uri
 *           description: Оригинальный URL
 *           example: "https://example.com/very/long/url"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *           example: "2024-01-15T10:30:00.000Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Дата истечения (если установлена)
 *           example: "2024-12-31T23:59:59.000Z"
 *     
 *     UrlInfo:
 *       type: object
 *       properties:
 *         originalUrl:
 *           type: string
 *           format: uri
 *           description: Оригинальный URL
 *           example: "https://example.com/very/long/url"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *           example: "2024-01-15T10:30:00.000Z"
 *         clickCount:
 *           type: integer
 *           description: Количество переходов
 *           example: 42
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Дата истечения (если установлена)
 *           example: "2024-12-31T23:59:59.000Z"
 *     
 *     UrlAnalytics:
 *       type: object
 *       properties:
 *         totalClicks:
 *           type: integer
 *           description: Общее количество кликов
 *           example: 42
 *         dailyClicks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               clicks:
 *                 type: integer
 *                 example: 5
 *         topCountries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               country:
 *                 type: string
 *                 example: "RU"
 *               clicks:
 *                 type: integer
 *                 example: 15
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Описание ошибки
 *           example: "originalUrl is required"
 *     
 *     Success:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Сообщение об успехе
 *           example: "Short URL deleted successfully"
 */

/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Создание короткой ссылки
 *     description: Создает сокращенную ссылку для переданного URL
 *     tags: [URLs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUrlRequest'
 *           examples:
 *             basic:
 *               summary: Базовый пример
 *               value:
 *                 originalUrl: "https://example.com/very/long/url"
 *             with_alias:
 *               summary: С пользовательским алиасом
 *               value:
 *                 originalUrl: "https://example.com/very/long/url"
 *                 alias: "my-alias"
 *             with_expiry:
 *               summary: С датой истечения
 *               value:
 *                 originalUrl: "https://example.com/very/long/url"
 *                 expiresAt: "2024-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Короткая ссылка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUrlResponse'
 *       400:
 *         description: Некорректные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_url:
 *                 summary: Отсутствует originalUrl
 *                 value:
 *                   error: "originalUrl is required"
 *               invalid_url:
 *                 summary: Некорректный URL
 *                 value:
 *                   error: "Invalid URL format"
 *               alias_taken:
 *                 summary: Алиас уже занят
 *                 value:
 *                   error: "Alias already exists"
 */
router.post(Routes.SHORTEN, urlController.createShortUrl);

/**
 * @swagger
 * /info/{shortUrl}:
 *   get:
 *     summary: Получение информации о ссылке
 *     description: Возвращает информацию о сокращенной ссылке без перехода
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Короткая ссылка
 *         example: "abc12345"
 *     responses:
 *       200:
 *         description: Информация о ссылке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlInfo'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Short URL not found"
 */
router.get(Routes.INFO, urlController.getUrlInfo);

/**
 * @swagger
 * /delete/{shortUrl}:
 *   delete:
 *     summary: Удаление короткой ссылки
 *     description: Удаляет сокращенную ссылку из системы
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Короткая ссылка для удаления
 *         example: "abc12345"
 *     responses:
 *       200:
 *         description: Ссылка успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Short URL not found"
 */
router.delete(Routes.DELETE, urlController.deleteShortUrl);

/**
 * @swagger
 * /analytics/{shortUrl}:
 *   get:
 *     summary: Получение аналитики ссылки
 *     description: Возвращает детальную аналитику по переходам для ссылки
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Короткая ссылка
 *         example: "abc12345"
 *     responses:
 *       200:
 *         description: Аналитика ссылки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlAnalytics'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Short URL not found"
 */
router.get(Routes.ANALYTICS, urlController.getUrlAnalytics);

/**
 * @swagger
 * /{shortUrl}:
 *   get:
 *     summary: Переадресация на оригинальный URL
 *     description: Переадресует пользователя на оригинальный URL и увеличивает счетчик кликов
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Короткая ссылка
 *         example: "abc12345"
 *     responses:
 *       302:
 *         description: Переадресация на оригинальный URL
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               format: uri
 *             description: Оригинальный URL
 *             example: "https://example.com/very/long/url"
 *       404:
 *         description: Ссылка не найдена или истекла
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               not_found:
 *                 summary: Ссылка не найдена
 *                 value:
 *                   error: "Short URL not found"
 *               expired:
 *                 summary: Ссылка истекла
 *                 value:
 *                   error: "Short URL has expired"
 */
router.get(Routes.SHORT_URL, urlController.redirectToOriginal);

export default router; 