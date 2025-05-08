"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
// Helper function to safely parse permissions
function safeParsePermissions(permissions) {
    if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
        // Ensure all values are boolean
        const parsed = {};
        for (const key in permissions) {
            if (Object.prototype.hasOwnProperty.call(permissions, key)) {
                parsed[key] = Boolean(permissions[key]);
            }
        }
        return parsed;
    }
    // If not a valid object, return empty object
    return {};
}
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: "Yetkilendirme başarısız, token sağlanmadı.", error: "no_token" });
    }
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
            return res.status(401).json({ message: "Geçersiz token payload.", error: "invalid_payload" });
        }
        const userId = decoded.userId;
        // Explicit tipi kullan
        const currentUserFromDb = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: {
                    select: {
                        name: true,
                        permissions: true
                    }
                }
            }
        });
        // currentUserFromDb ve rolünün varlığını kontrol et
        if (!currentUserFromDb || !currentUserFromDb.role) {
            return res.status(401).json({ message: "Bu tokena sahip kullanıcı veya rol bilgisi bulunamadı.", error: "user_or_role_not_found" });
        }
        // Kullanıcı bilgilerini req nesnesine ekle
        req.user = {
            id: decoded.userId,
            email: currentUserFromDb.email,
            role: currentUserFromDb.role.name,
            permissions: safeParsePermissions(currentUserFromDb.role.permissions)
        };
        next();
    }
    catch (error) {
        // Hata loglamayı production ortamında daha kontrollü yapabilirsiniz
        console.error('[Auth Protect] Middleware Error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError || error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: "Yetkilendirme başarısız, geçersiz veya süresi dolmuş token.", error: "invalid_token" });
        }
        return res.status(500).json({ message: "Sunucu hatası.", error: "internal_server_error" });
    }
});
exports.protect = protect;
// Yetkilendirme Middleware'i (Opsiyonel)
const authorize = (requiredPermissions) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Yetkilendirme başarısız: Oturum açılmamış.', error: 'unauthenticated' });
        }
        // Kullanıcıyı ve rollerini tekrar DB'den çekmek yerine req.user'daki bilgiyi kullanalım
        const userPermissions = req.user.permissions || {}; // req.user'dan al, yoksa boş obje
        const hasPermission = requiredPermissions.every(p => userPermissions[p] === true);
        if (!hasPermission) {
            return res.status(403).json({ message: 'Erişim reddedildi: Yetersiz yetki.', error: 'forbidden' });
        }
        next(); // Yetkili, devam et
    });
};
exports.authorize = authorize;
