import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'; // Prisma hatalarını yakalamak için

// Hata tipleri için daha belirgin arayüzler (opsiyonel ama önerilir)
interface ApiError extends Error {
    statusCode?: number;
    success?: boolean;
    isOperational?: boolean; // Operasyonel hataları işaretlemek için
}

/**
 * @description Express uygulaması için merkezi hata yakalama middleware'i.
 *              Farklı hata türlerini yakalar ve uygun JSON yanıtı döndürür.
 * @param err Yakalanan hata nesnesi (Error veya türevleri)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const errorMiddleware = (err: ApiError, req: Request, res: Response, next: NextFunction): void => {
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
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Örnek: Benzersiz kısıtlama ihlali
        if (err.code === 'P2002') {
            statusCode = 409; // Conflict
            // Hangi alanın çakıştığını bulmaya çalış
            const target = err.meta?.target as string[] | undefined;
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
    else if (err instanceof Prisma.PrismaClientValidationError) {
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
    res.status(statusCode).json({
        success: success,
        message: message,
        // Geliştirme ortamında ek detayları gönder (opsiyonel)
        ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
    });
};

// Örnek olarak özel bir ApiError sınıfı (isteğe bağlı)
export class CustomApiError extends Error implements ApiError {
    statusCode: number;
    success: boolean;
    isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational: boolean = true) {
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