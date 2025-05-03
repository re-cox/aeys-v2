"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
/**
 * Merkezi hata işleme middleware'i
 * Uygulama genelindeki hataları yakalar ve standart bir yanıt formatı ile döndürür
 */
const errorHandler = (err, req, res, next) => {
    console.error('Hata yakalandı:', err);
    // Hata kodu ve mesajı
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Sunucu hatası';
    // Hata detayları
    const errorDetails = {
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code,
        path: req.path
    };
    // Validate DB bağlantı hatalarını işle
    if (err.code === 'P2001' || err.code === 'P2002' || err.code === 'P2003') {
        errorDetails.message = 'Veritabanı işlemi sırasında bir hata oluştu';
    }
    // Prisma bağlantı hatalarını işle
    if (err.code === 'P1001' || err.code === 'P1002') {
        errorDetails.message = 'Veritabanına bağlanılamadı';
    }
    // JSON parse hatalarını işle
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Geçersiz JSON formatı',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    return res.status(statusCode).json(errorDetails);
};
exports.errorHandler = errorHandler;
/**
 * Bilinmeyen/bulunamayan rotaları yakala
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `İstenen yol bulunamadı: ${req.originalUrl}`
    });
};
exports.notFoundHandler = notFoundHandler;
