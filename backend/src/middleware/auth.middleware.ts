import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as OfficialJwtPayload, VerifyErrors } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/auth';

// Genişletilmiş JWT Payload tipi
interface JwtPayload extends OfficialJwtPayload {
  userId: string;
  email: string;
  role?: string;
}

// Express Request tipini genişlet (Global tanımın bu şekilde olduğunu varsayıyoruz)
declare global {
  namespace Express {
    interface Request {
      user?: {
          id: string;
          email: string;
          role: string;
          permissions: any;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
      token = req.headers.authorization.split(' ')[1];
  }

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