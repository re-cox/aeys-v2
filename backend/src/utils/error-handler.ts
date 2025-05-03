import { Request, Response, NextFunction } from 'express';

interface ErrorWithCode extends Error {
  code?: string;
  status?: number;
}

/**
 * Merkezi hata işleme middleware'i
 */
export const errorHandler = (
  err: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Hata yakalandı:', err);
  
  // Hatanın HTTP durum kodu (varsayılan: 500)
  const statusCode = err.status || 500;
  
  // Geliştirme ortamında daha fazla bilgi
  const devError = process.env.NODE_ENV === 'development' 
    ? { stack: err.stack, code: err.code }
    : {};
  
  // Hata yanıtını oluştur
  const errorResponse = {
    success: false,
    message: err.message || 'Bir hata oluştu',
    ...devError
  };
  
  // Hatayı istemciye gönder
  res.status(statusCode).json(errorResponse);
};

/**
 * Route handler'ların async/await kullanımı için sarmalayıcı
 */
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * İsteğe bağlı hata oluşturucu
 */
export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.status = statusCode;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
} 