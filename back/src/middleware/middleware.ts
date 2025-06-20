import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Для JSON parse ошибок возвращаем 400, а не 500
  if (error.type === 'entity.parse.failed' || error.statusCode === 400) {
    res.status(400).json({
      error: 'Invalid JSON format',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }

  // Остальные ошибки логируем и возвращаем 500
  console.error('Error:', error);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
  
  return;
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found'
  });
}; 