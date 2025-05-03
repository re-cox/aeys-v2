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
exports.authenticate = exports.protect = exports.authorizePermission = exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Token doğrulama ara katmanı
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test için geçici bypass kaldırıldı.
        // return next();
        // Gerçek token doğrulaması
        const authHeader = req.headers["authorization"];
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1]; // Optional chaining ile null kontrolü
        if (!token) {
            return res.status(401).json({ message: "Kimlik doğrulama başarısız: Token bulunamadı" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(403).json({ message: "Kimlik doğrulama başarısız: Geçersiz token" });
        }
        // Kullanıcıyı veritabanından bulma
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true }
        });
        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }
        // Request nesnesine kullanıcıyı ekleme
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            permissions: user.role.permissions
        };
        next();
    }
    catch (error) {
        return res.status(500).json({ message: "Sunucu hatası", error });
    }
});
exports.authenticateToken = authenticateToken;
// Yetki kontrolü için ara katman
const authorizePermission = (requiredPermission) => {
    return (req, res, next) => {
        var _a;
        try {
            // Test için geçici bypass kaldırıldı.
            // return next();
            // Gerçek yetki kontrolü
            const userPermissions = (_a = req.user) === null || _a === void 0 ? void 0 : _a.permissions;
            if (!userPermissions || !userPermissions[requiredPermission]) {
                return res.status(403).json({
                    message: "Yetki reddedildi: Bu işlem için gerekli izne sahip değilsiniz"
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({ message: "Sunucu hatası", error });
        }
    };
};
exports.authorizePermission = authorizePermission;
// `protect` fonksiyonu - middleware klasöründen middlewares klasörüne taşındı
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Geliştirme için bypass kaldırıldı
    // return next();
    // Gerçek doğrulama işlemi
    if (!token) {
        return res.status(401).json({ message: 'Yetkilendirme başarısız, token sağlanmadı.', error: 'no_token' });
    }
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
            return res.status(401).json({ message: 'Geçersiz token payload.', error: 'invalid_payload' });
        }
        const userId = decoded.userId;
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
        if (!currentUserFromDb || !currentUserFromDb.role) {
            return res.status(401).json({ message: 'Bu tokena sahip kullanıcı veya rol bilgisi bulunamadı.', error: 'user_or_role_not_found' });
        }
        req.user = {
            id: currentUserFromDb.id,
            email: currentUserFromDb.email,
            role: currentUserFromDb.role.name,
            permissions: currentUserFromDb.role.permissions
        };
        next();
    }
    catch (error) {
        console.error('[Auth Middleware] Yetkilendirme hatası:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError || error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Yetkilendirme başarısız, geçersiz veya süresi dolmuş token.', error: 'invalid_token' });
        }
        return res.status(500).json({ message: 'Sunucu hatası.', error: 'internal_server_error' });
    }
});
exports.protect = protect;
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Token'ı al
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error('[Auth Middleware] Token bulunamadı: Authorization header eksik');
            return res.status(401).json({ error: 'Yetkilendirme hatası: Token bulunamadı' });
        }
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!token) {
            console.error('[Auth Middleware] Token boş: Authorization header mevcut ama token boş');
            return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token formatı' });
        }
        console.log('[Auth Middleware] Token doğrulanıyor...');
        try {
            // JWT token'ı doğrula
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (!decoded || typeof decoded !== 'object') {
                console.error('[Auth Middleware] Token decode hatası: Geçersiz token formatı');
                return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token içeriği' });
            }
            // Token içeriğinin doğru olup olmadığını kontrol et
            // Not: Farklı token formatları için iki olasılığı kontrol edelim (id veya userId)
            const userId = decoded.id || decoded.userId;
            if (!userId) {
                console.error('[Auth Middleware] Token içeriği hatalı: id veya userId bulunamadı', decoded);
                return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token içeriği' });
            }
            // Kullanıcıyı veritabanından bul
            console.log(`[Auth Middleware] Kullanıcı sorgulanıyor: ${userId}`);
            const user = yield prismaClient.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    surname: true,
                    role: true
                }
            });
            if (!user) {
                console.error(`[Auth Middleware] Kullanıcı bulunamadı: ${userId}`);
                return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bulunamadı' });
            }
            console.log(`[Auth Middleware] Yetkilendirme başarılı: ${user.name || user.email}`);
            // Kullanıcıyı request nesnesine ekle
            req.user = {
                id: user.id,
                email: user.email,
                role: typeof user.role === 'object' && user.role !== null ? user.role.name : 'user',
                permissions: typeof user.role === 'object' && user.role !== null ? user.role.permissions : {}
            };
            // Devam et
            next();
        }
        catch (jwtError) {
            console.error('[Auth Middleware] Token doğrulama hatası:', jwtError);
            return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token' });
        }
    }
    catch (error) {
        console.error('[Auth Middleware] Beklenmeyen yetkilendirme hatası:', error);
        return res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.authenticate = authenticate;
