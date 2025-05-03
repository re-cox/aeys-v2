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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
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
