"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.loginUser = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt = __importStar(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env"); // Ortam değişkenleri için
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log('[Backend Auth] Login isteği alındı');
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('[Backend Auth] Eksik alanlar:', { email: !!email, password: !!password });
        return res.status(400).json({ message: 'Email ve şifre gereklidir.', error: 'missing_fields' });
    }
    try {
        console.log('[Backend Auth] Kullanıcı aranıyor:', email);
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    select: { name: true, permissions: true }
                },
                employee: {
                    select: {
                        id: true,
                        department: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });
        if (!user) {
            console.log('[Backend Auth] Kullanıcı bulunamadı:', email);
            return res.status(401).json({ message: 'Geçersiz email veya şifre.', error: 'invalid_credentials' });
        }
        console.log('[Backend Auth] Kullanıcı bulundu:', user.name, user.surname);
        // Şifreyi doğrula
        const isValidPassword = yield bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            console.log('[Backend Auth] Şifre doğrulama başarısız:', email);
            return res.status(401).json({ message: 'Geçersiz email veya şifre.', error: 'invalid_credentials' });
        }
        console.log('[Backend Auth] Şifre doğrulandı, token oluşturuluyor...');
        // JWT Payload oluştur
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            roleId: user.roleId,
            roleName: (_a = user.role) === null || _a === void 0 ? void 0 : _a.name,
            permissions: (_b = user.role) === null || _b === void 0 ? void 0 : _b.permissions,
            employeeId: (_c = user.employee) === null || _c === void 0 ? void 0 : _c.id,
            departmentId: (_e = (_d = user.employee) === null || _d === void 0 ? void 0 : _d.department) === null || _e === void 0 ? void 0 : _e.id,
            departmentName: (_g = (_f = user.employee) === null || _f === void 0 ? void 0 : _f.department) === null || _g === void 0 ? void 0 : _g.name
        };
        // JWT Token oluştur
        const jwtOptions = {
            expiresIn: 86400 // 1 gün = 24 * 60 * 60 = 86400 saniye
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, env_1.env.JWT_SECRET, // Ortam değişkeninden gizli anahtarı al
        jwtOptions // Ayrı tanımlanan options nesnesi
        );
        // Yanıttan hassas verileri çıkar (passwordHash)
        const { passwordHash: _passwordHash } = user, userData = __rest(user, ["passwordHash"]);
        console.log('[Backend Auth] Giriş başarılı:', email);
        // Başarılı yanıtı gönder
        return res.status(200).json({
            user: userData,
            token: token,
        });
    }
    catch (error) {
        console.error('[Backend Auth] Giriş hatası:', error);
        // Genel hata mesajı
        return res.status(500).json({
            message: 'Giriş sırasında sunucu hatası oluştu.',
            error: error instanceof Error ? error.message : 'server_error'
        });
    }
});
exports.loginUser = loginUser;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[Backend Auth] /me isteği alındı');
    // protect middleware'i kullanıcıyı req.user'a ekledi
    const user = req.user;
    if (!user) {
        // Bu durum normalde protect middleware'i tarafından yakalanmalı
        console.error('[Backend Auth] /me hatası: req.user tanımsız!');
        return res.status(401).json({ message: 'Yetkilendirme başarısız.', error: 'unauthorized' });
    }
    try {
        console.log('[Backend Auth] /me - Kullanıcı ID:', user.id);
        const currentUserData = yield prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                role: { select: { name: true, permissions: true } },
                employee: {
                    select: {
                        id: true,
                        department: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });
        if (!currentUserData) {
            console.error('[Backend Auth] /me hatası: Kullanıcı veritabanında bulunamadı, ID:', user.id);
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.', error: 'user_not_found' });
        }
        console.log('[Backend Auth] /me başarılı, kullanıcı bilgileri gönderiliyor:', currentUserData.email);
        return res.status(200).json({ user: currentUserData });
    }
    catch (error) {
        console.error('[Backend Auth] /me sırasında hata:', error);
        return res.status(500).json({
            message: 'Kullanıcı bilgileri alınırken sunucu hatası oluştu.',
            error: error instanceof Error ? error.message : 'server_error'
        });
    }
});
exports.getMe = getMe;
