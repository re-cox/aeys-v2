"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = void 0;
/**
 * Hata durumlarında loglama yapmak için yardımcı fonksiyon
 *
 * @param message Hata mesajı
 * @param error Yakalanan hata nesnesi
 */
const errorLogger = (message, error) => {
    console.error(`[ERROR] ${message}`);
    if (error instanceof Error) {
        console.error(`[ERROR] Mesaj: ${error.message}`);
        console.error(`[ERROR] Stack: ${error.stack}`);
    }
    else {
        console.error(`[ERROR] Bilinmeyen hata: ${error}`);
    }
};
exports.errorLogger = errorLogger;
