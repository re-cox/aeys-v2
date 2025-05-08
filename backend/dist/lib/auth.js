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
exports.authOptions = void 0;
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
// Diğer sağlayıcıları import edin (GoogleProvider, GithubProvider vb.)
// import GoogleProvider from 'next-auth/providers/google';
const prisma_adapter_1 = require("@next-auth/prisma-adapter");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
exports.authOptions = {
    adapter: (0, prisma_adapter_1.PrismaAdapter)(prisma),
    providers: [
        (0, credentials_1.default)({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
                password: { label: "Password", type: "password" }
            },
            authorize(credentials, req) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                        return null;
                    }
                    const user = yield prisma.user.findUnique({
                        where: { email: credentials.email },
                        include: { role: true }
                    });
                    if (!user || !user.passwordHash) {
                        // Kullanıcı bulunamadı veya şifresi hashlenmemiş
                        console.error(`Yetkilendirme hatası: Kullanıcı bulunamadı veya şifre hashlenmemiş - ${credentials.email}`);
                        return null;
                    }
                    const isValidPassword = yield bcrypt_1.default.compare(credentials.password, user.passwordHash);
                    if (!isValidPassword) {
                        console.error(`Yetkilendirme hatası: Geçersiz şifre - ${credentials.email}`);
                        return null;
                    }
                    // Yetkilendirme başarılı, kullanıcı nesnesini döndür
                    console.log(`Yetkilendirme başarılı: ${user.email}`);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        roleId: user.roleId,
                        // Gerekirse diğer kullanıcı bilgilerini ekleyin
                    };
                });
            }
        }),
        // Diğer sağlayıcıları buraya ekleyin
        // GoogleProvider({...}),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        // JWT callback'i token'a ek bilgiler eklemek için
        jwt(_a) {
            return __awaiter(this, arguments, void 0, function* ({ token, user }) {
                if (user) {
                    token.id = user.id;
                    // Kullanıcı nesnesinde 'role' alanı varsa token'a ekle
                    if ('role' in user) {
                        token.role = user.role;
                    }
                }
                return token;
            });
        },
        // Session callback'i session nesnesine ek bilgiler eklemek için
        session(_a) {
            return __awaiter(this, arguments, void 0, function* ({ session, token }) {
                if (session.user) {
                    // Session kullanıcı nesnesine ID ve rol ekle
                    if (token.id) {
                        session.user.id = token.id;
                    }
                    if (token.role) {
                        session.user.role = token.role;
                    }
                }
                return session;
            });
        }
    },
    secret: process.env.NEXTAUTH_SECRET, // .env dosyasında tanımlanmalı
    debug: process.env.NODE_ENV === 'development',
    pages: {
        signIn: '/login', // Özel giriş sayfası yolu (frontend'de)
        // error: '/auth/error', // Hata sayfası yolu
    }
};
