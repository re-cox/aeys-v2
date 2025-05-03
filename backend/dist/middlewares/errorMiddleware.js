"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomApiError = exports.errorMiddleware = void 0;
const client_1 = require("@prisma/client"); // Prisma hatalarını yakalamak için
/**
 * @description Express uygulaması için merkezi hata yakalama middleware'i.
 *              Farklı hata türlerini yakalar ve uygun JSON yanıtı döndürür.
 * @param err Yakalanan hata nesnesi (Error veya türevleri)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
const errorMiddleware = (err, req, res, next) => {
    var _a;
    // Varsayılan hata durumu ve mesajı
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Sunucuda bir hata oluştu.';
    let success = err.success === undefined ? false : err.success; // Varsayılan false
    // Geliştirme ortamında daha detaylı loglama
    if (process.env.NODE_ENV === 'development') {
        console.error('-------------------- HATA --------------------');
        console.error('İstek Yolu:', req.originalUrl);
        console.error('İstek Metodu:', req.method);
        console.error('Hata Mesajı:', err.message);
        console.error('Hata Yığını:', err.stack);
        console.error('---------------------------------------------');
    }
    // Prisma ile ilgili bilinen hataları işle
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Örnek: Benzersiz kısıtlama ihlali
        if (err.code === 'P2002') {
            statusCode = 409; // Conflict
            // Hangi alanın çakıştığını bulmaya çalış
            const target = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target;
            message = `${target ? target.join(', ') : 'Alan'} zaten mevcut.`;
            success = false;
        }
        // Örnek: Kayıt bulunamadı (Update/Delete)
        else if (err.code === 'P2025') {
            statusCode = 404; // Not Found
            message = 'İşlem yapılacak kayıt bulunamadı.';
            success = false;
        }
        // Diğer Prisma hataları için genel mesaj
        else {
            statusCode = 400; // Bad Request (genel veritabanı hatası)
            message = 'Veritabanı işlemi sırasında bir hata oluştu.';
            success = false;
        }
    }
    // Prisma validasyon hataları
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400; // Bad Request
        message = 'Geçersiz veri sağlandı. Lütfen girdilerinizi kontrol edin.';
        success = false;
    }
    // Diğer operasyonel hatalar (örneğin, bizim tarafımızdan bilerek fırlatılan hatalar)
    else if (err.isOperational) {
        // statusCode ve message zaten err nesnesinden gelmeli
    }
    // Beklenmedik diğer hatalar
    else {
        // Üretim ortamında genel bir mesaj göster
        if (process.env.NODE_ENV === 'production') {
            message = 'Sunucuda beklenmeyen bir hata oluştu.';
        }
        // Geliştirme ortamında hata detayını koru (zaten yukarıda yapıldı)
    }
    // Hata yanıtını gönder
    console.error('[Error Middleware] Yanıt Gönderiliyor:', { statusCode, message, success }); // Ekstra loglama
    res.status(statusCode).json(Object.assign({ success: success, message: message }, (process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })));
};
exports.errorMiddleware = errorMiddleware;
// Örnek olarak özel bir ApiError sınıfı (isteğe bağlı)
class CustomApiError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.success = false; // Hatalar genellikle 'success: false' olur
        this.isOperational = isOperational;
        // Hata sınıfının adını ayarla
        this.name = this.constructor.name;
        // Stack trace'i yakala (V8 için)
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomApiError = CustomApiError;
