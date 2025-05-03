"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// .env dosyasını yükle
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Çevre değişkenlerini tanımla
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5001', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aeys',
    JWT_SECRET: process.env.JWT_SECRET || 'aydem-elektrik-yonetim-sistemi-gizli-anahtar-2024',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};
// Çevre değişkenlerini kontrol et
if (!exports.env.DATABASE_URL) {
    console.error('DATABASE_URL çevre değişkeni tanımlanmamış!');
    process.exit(1);
}
if (!exports.env.JWT_SECRET) {
    console.error('JWT_SECRET çevre değişkeni tanımlanmamış!');
    process.exit(1);
}
console.log(`[Environment] NODE_ENV: ${exports.env.NODE_ENV}`);
console.log(`[Environment] PORT: ${exports.env.PORT}`);
console.log(`[Environment] FRONTEND_URL: ${exports.env.FRONTEND_URL}`);
