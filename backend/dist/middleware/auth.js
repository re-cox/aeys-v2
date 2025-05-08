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
exports.ensureAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * @description Kimlik doğrulama middleware'i. Token'ı doğrular ve kullanıcıyı req nesnesine ekler.
 */
const ensureAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme başarısız: Token bulunamadı veya formatı yanlış.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        // Token'dan alınan kullanıcı ID'si ile veritabanından kullanıcıyı bul (isteğe bağlı ama önerilir)
        const user = yield prisma.user.findUnique({
            where: { id: decoded.id },
            include: { role: true } // Rolü dahil et
        });
        if (!user) {
            return res.status(401).send('Geçersiz token: Kullanıcı bulunamadı');
        }
        // req.user nesnesini auth.middleware.ts'deki tanımla tutarlı hale getir
        req.user = {
            id: decoded.id,
            email: user.email, // email ekle
            role: user.role.name, // rol adını ekle
            name: user.name, // Opsiyonel isim ekle
            // permissions buraya eklenmeyebilir, roleMiddleware'de kontrol edilebilir
        };
        next();
    }
    catch (error) {
        console.error('Token doğrulama hatası:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Yetkilendirme başarısız: Oturum süresi dolmuş.' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Yetkilendirme başarısız: Geçersiz token.' });
        }
        return res.status(401).json({ message: 'Yetkilendirme başarısız.' });
    }
});
exports.ensureAuth = ensureAuth;
// İsteğe bağlı: Rol bazlı yetkilendirme middleware'i
/*
export const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  ensureAuth(req, res, async () => { // Önce normal auth çalıştır
    if (!req.user) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız.' });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user && user.role === 'ADMIN') { // Rolü kontrol et
        next();
      } else {
        res.status(403).json({ message: 'Erişim reddedildi: Yönetici yetkisi gerekli.' });
      }
    } catch (error) {
        console.error('Admin kontrol hatası:', error);
        res.status(500).json({ message: 'Yetki kontrolü sırasında sunucu hatası.' });
    }
  });
};
*/ 
