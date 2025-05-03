"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.asyncHandler = exports.errorHandler = void 0;
/**
 * Merkezi hata işleme middleware'i
 */
const errorHandler = (err, req, res, next) => {
    console.error('Hata yakalandı:', err);
    // Hatanın HTTP durum kodu (varsayılan: 500)
    const statusCode = err.status || 500;
    // Geliştirme ortamında daha fazla bilgi
    const devError = process.env.NODE_ENV === 'development'
        ? { stack: err.stack, code: err.code }
        : {};
    // Hata yanıtını oluştur
    const errorResponse = Object.assign({ success: false, message: err.message || 'Bir hata oluştu' }, devError);
    // Hatayı istemciye gönder
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * Route handler'ların async/await kullanımı için sarmalayıcı
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
/**
 * İsteğe bağlı hata oluşturucu
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.status = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
