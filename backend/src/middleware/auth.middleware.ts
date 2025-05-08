import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as OfficialJwtPayload, VerifyErrors } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/auth';
import { Prisma } from '@prisma/client';

// Genişletilmiş JWT Payload tipi
interface JwtPayload extends OfficialJwtPayload {
  userId: string;
  email: string;
  role?: string;
}

// Type Augmentation (Bu genellikle ayrı bir types/express/index.d.ts dosyasında yapılır)
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role?: string; // Rol adını string olarak tutalım (veya roleId)
      permissions?: Record<string, boolean>;
      name?: string; // Opsiyonel olarak name eklendi
      // Diğer gerekli alanlar buraya eklenebilir
    };
  }
}

// Helper function to safely parse permissions
function safeParsePermissions(permissions: any): Record<string, boolean> {
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
    // Ensure all values are boolean
    const parsed: Record<string, boolean> = {};
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

// Explicit type for the selected user data
type SelectedUserData = {
  id: string;
  email: string;
  role: {
    name: string;
    permissions: Prisma.JsonValue; // Prisma'dan gelen Json tipini kullan
  } | null; // Rol ilişkisi null olabilir
} | null; // Kullanıcı bulunamayabilir

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
      token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Yetkilendirme başarısız, token sağlanmadı.", error: "no_token" });
  }

  try {
    const decoded = verifyToken(token as string) as JwtPayload;

    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return res.status(401).json({ message: "Geçersiz token payload.", error: "invalid_payload" });
    }

    const userId = decoded.userId;

    // Explicit tipi kullan
    const currentUserFromDb: SelectedUserData = await prisma.user.findUnique({
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

  } catch (error) {
    // Hata loglamayı production ortamında daha kontrollü yapabilirsiniz
    console.error('[Auth Protect] Middleware Error:', error); 
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Yetkilendirme başarısız, geçersiz veya süresi dolmuş token.", error: "invalid_token" });
    }
    return res.status(500).json({ message: "Sunucu hatası.", error: "internal_server_error" });
  }
};

// Yetkilendirme Middleware'i (Opsiyonel)
export const authorize = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
    };
}; 