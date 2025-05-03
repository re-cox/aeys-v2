import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { prisma } from "../lib/prisma";
import jwt, { JwtPayload as OfficialJwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { errorLogger } from '../utils/errorLogger';

const prismaClient = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Express Request için tip tanımı
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role?: string;
        permissions?: Record<string, boolean>;
      };
    }
  }
}

// JwtPayload tipi tanımı
interface JwtPayload extends OfficialJwtPayload {
  userId: string;
  email: string;
  role?: string;
}

// Token doğrulama ara katmanı
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Test için geçici bypass kaldırıldı.
    // return next();
    
    // Gerçek token doğrulaması
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Optional chaining ile null kontrolü

    if (!token) {
      return res.status(401).json({ message: "Kimlik doğrulama başarısız: Token bulunamadı" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ message: "Kimlik doğrulama başarısız: Geçersiz token" });
    }

    // Kullanıcıyı veritabanından bulma
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    return res.status(500).json({ message: "Sunucu hatası", error });
  }
};

// Yetki kontrolü için ara katman
export const authorizePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Test için geçici bypass kaldırıldı.
      // return next();
      
      // Gerçek yetki kontrolü
      const userPermissions = req.user?.permissions as any;
      
      if (!userPermissions || !userPermissions[requiredPermission]) {
        return res.status(403).json({ 
          message: "Yetki reddedildi: Bu işlem için gerekli izne sahip değilsiniz" 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: "Sunucu hatası", error });
    }
  };
};

// `protect` fonksiyonu - middleware klasöründen middlewares klasörüne taşındı
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Geliştirme için bypass kaldırıldı
  // return next();

  // Gerçek doğrulama işlemi
  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız, token sağlanmadı.', error: 'no_token' });
  }

  try {
    const decoded = verifyToken(token as string) as JwtPayload;

    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return res.status(401).json({ message: 'Geçersiz token payload.', error: 'invalid_payload' });
    }

    const userId = decoded.userId;

    const currentUserFromDb = await prisma.user.findUnique({
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

  } catch (error) {
    console.error('[Auth Middleware] Yetkilendirme hatası:', error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız, geçersiz veya süresi dolmuş token.', error: 'invalid_token' });
    }
    return res.status(500).json({ message: 'Sunucu hatası.', error: 'internal_server_error' });
  }
};

/**
 * Kimlik doğrulama middleware'i
 * JWT token'ı doğrular ve kullanıcı bilgilerini req.user'a ekler
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    console.log('[Auth Middleware] İstek geldi:', req.method, req.originalUrl);
    console.log('[Auth Middleware] Headers:', JSON.stringify(req.headers, null, 2));
    
    // Authorization header'ını kontrol et
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('[Auth Middleware] Authorization header yok!');
      return res.status(401).json({ error: 'Erişim reddedildi: Yetkilendirme token\'ı gerekli' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[Auth Middleware] Authorization header Bearer formatında değil:', authHeader);
      return res.status(401).json({ error: 'Erişim reddedildi: Geçersiz token formatı' });
    }
    
    // Token'ı çıkar
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.error('[Auth Middleware] Token boş!');
      return res.status(401).json({ error: 'Erişim reddedildi: Geçersiz token formatı' });
    }
    
    console.log('[Auth Middleware] Token alındı, doğrulanıyor...');
    
    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      console.log('[Auth Middleware] Token doğrulandı. Payload:', JSON.stringify(decoded, null, 2));
      
      // Kullanıcıyı veritabanında kontrol et
      console.log('[Auth Middleware] Kullanıcı ID:', decoded.userId);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true
        }
      });
      
      // Kullanıcı yoksa
      if (!user) {
        console.error('[Auth Middleware] Kullanıcı bulunamadı:', decoded.userId);
        return res.status(401).json({ error: 'Erişim reddedildi: Kullanıcı bulunamadı' });
      }
      
      console.log('[Auth Middleware] Kullanıcı doğrulandı:', user.email);
      
      // Kullanıcı bilgilerini request nesnesine ekle
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      };
      
      console.log('[Auth Middleware] Yetkilendirme başarılı, sonraki middleware\'e geçiliyor');
      
      // Sonraki middleware'e geç
      next();
    } catch (tokenError) {
      // JWT doğrulama hatası
      console.error('[Auth Middleware] Token doğrulama hatası:', tokenError);
      
      if ((tokenError as Error).name === 'TokenExpiredError') {
        console.error('[Auth Middleware] Token süresi dolmuş!');
        return res.status(401).json({ error: 'Erişim reddedildi: Token süresi dolmuş' });
      }
      
      if ((tokenError as Error).name === 'JsonWebTokenError') {
        console.error('[Auth Middleware] Geçersiz JWT formatı!');
        return res.status(401).json({ error: 'Erişim reddedildi: Geçersiz token formatı' });
      }
      
      return res.status(401).json({ error: 'Erişim reddedildi: Geçersiz token' });
    }
  } catch (error) {
    // Diğer hatalar
    console.error('[Auth Middleware] Beklenmeyen hata:', error);
    errorLogger('Yetkilendirme hatası', error);
    return res.status(500).json({ error: 'Sunucu hatası: Yetkilendirme işlemi sırasında bir hata oluştu' });
  }
}; 