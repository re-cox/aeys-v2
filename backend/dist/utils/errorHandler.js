"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
/**
 * Hata işleme yardımcı fonksiyonu
 * Farklı hata türlerini işler ve uygun HTTP durum kodu ve hata mesajı ile yanıt verir
 */
const errorHandler = (error, req, res) => {
    var _a;
    console.error(`[Error Handler] Hata işleniyor:`, error);
    // Prisma veritabanı hatalarını işle
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Unique constraint ihlali
        if (error.code === 'P2002') {
            const field = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target;
            return res.status(409).json({
                error: `Bu ${field ? field.join(', ') : 'değer'} zaten kullanılıyor.`,
                code: error.code
            });
        }
        // Kayıt bulunamadı
        if (error.code === 'P2001' || error.code === 'P2018') {
            return res.status(404).json({
                error: 'Belirtilen kayıt bulunamadı.',
                code: error.code
            });
        }
        // Foreign key constraint ihlali
        if (error.code === 'P2003') {
            return res.status(400).json({
                error: 'İlişkili bir kayıt nedeniyle bu işlem gerçekleştirilemiyor.',
                code: error.code
            });
        }
        // Diğer Prisma hataları
        return res.status(400).json({
            error: 'Veritabanı işlemi sırasında bir hata oluştu.',
            details: error.message,
            code: error.code
        });
    }
    // Prisma başlatma hatası
    if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        console.error('[Error Handler] Veritabanı bağlantı hatası:', error);
        return res.status(500).json({
            error: 'Veritabanına bağlanırken bir hata oluştu. Lütfen sistem yöneticinize başvurun.',
            details: error.message
        });
    }
    // Prisma sorgu zamanı hatası
    if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
        console.error('[Error Handler] Kritik Prisma hatası:', error);
        return res.status(500).json({
            error: 'Veritabanı işlemi sırasında kritik bir hata oluştu.',
            details: error.message
        });
    }
    // Prisma genel hataları
    if (error instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
        return res.status(500).json({
            error: 'Veritabanı işlemi sırasında bilinmeyen bir hata oluştu.',
            details: error.message
        });
    }
    // Bilinmeyen hata
    if (error instanceof Error) {
        return res.status(500).json({
            error: 'Bir hata oluştu.',
            details: error.message
        });
    }
    // Varsayılan hata yanıtı
    return res.status(500).json({
        error: 'Sunucu hatası.',
        details: 'Bilinmeyen bir hata oluştu.'
    });
};
exports.default = errorHandler;
