"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorLogger_1 = require("./errorLogger");
/**
 * Merkezi hata işleme middleware'i
 * @param error Yakalanan hata
 * @param req Express request nesnesi
 * @param res Express response nesnesi
 */
const errorHandler = (error, req, res) => {
    var _a;
    // Hatayı logla
    (0, errorLogger_1.errorLogger)('Beklenmeyen hata', error);
    // Hata tipine göre uygun HTTP yanıtı döndür
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Doğrulama hatası',
            details: error.message
        });
    }
    if (error.name === 'UnauthorizedError' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('JWT'))) {
        return res.status(401).json({
            error: 'Yetkilendirme hatası',
            details: error.message
        });
    }
    if (error.name === 'ForbiddenError') {
        return res.status(403).json({
            error: 'Erişim reddedildi',
            details: error.message
        });
    }
    if (error.name === 'NotFoundError') {
        return res.status(404).json({
            error: 'Kaynak bulunamadı',
            details: error.message
        });
    }
    // Diğer hatalar için 500 Internal Server Error
    return res.status(500).json({
        error: 'Sunucu hatası',
        details: error.message || 'Beklenmeyen bir hata oluştu'
    });
};
exports.default = errorHandler;
