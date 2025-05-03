"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Geliştirme ortamında global nesne üzerinden Prisma'yı kullan
// Üretim ortamında ise her zaman yeni bir örnek oluştur
exports.prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Development ortamında global nesneyi kullan
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
