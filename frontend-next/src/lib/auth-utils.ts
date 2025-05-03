import { verify, sign, Secret, JsonWebTokenError, TokenExpiredError, NotBeforeError, JwtPayload } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Always use the same JWT secret across all routes
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
console.log('JWT_SECRET first 5 chars:', JWT_SECRET.substring(0, 5) + '...');

/**
 * Extracts and verifies a JWT token from the Authorization header
 */
export async function verifyAuthToken(req: NextRequest): Promise<JwtPayload | null> {
  try {
    // Log headers for debugging
    console.log('[Auth] Gelen istek başlıkları:', Object.fromEntries([...req.headers.entries()]));
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('[Auth] Authorization başlığı bulunamadı');
      return null;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('[Auth] Authorization başlığı "Bearer " ile başlamıyor:', authHeader.substring(0, 15) + '...');
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim() === '') {
      console.log('[Auth] Boş token');
      return null;
    }
    
    console.log('[Auth] Token uzunluğu:', token.length, 'İlk 10 karakter:', token.substring(0, 10) + '...');
    
    try {
      // Decode before verification for better debugging
      const decoded = decodeToken(token);
      if (!decoded) {
        console.log('[Auth] Token decode edilemedi (geçerli JWT formatı değil)');
        return null;
      }
      
      console.log('[Auth] Token başarıyla decode edildi:',
                 'EmployeeId:', decoded.employeeId,
                 'Email:', decoded.email,
                 'Yayın zamanı:', new Date(decoded.iat * 1000).toISOString());
      
      // Verify token
      try {
        const verified = verify(token, JWT_SECRET as Secret);
        console.log('[Auth] Token doğrulandı');
        return verified as JwtPayload;
      } catch (jwtError) {
        if (jwtError instanceof TokenExpiredError) {
          console.error('[Auth] Token süresi doldu:', jwtError.expiredAt);
        } else if (jwtError instanceof JsonWebTokenError) {
          console.error('[Auth] JWT Hatası:', jwtError.message);
        } else if (jwtError instanceof NotBeforeError) {
          console.error('[Auth] Token henüz geçerli değil. Geçerlilik başlangıcı:', jwtError.date);
        } else {
          console.error('[Auth] Bilinmeyen token doğrulama hatası:', jwtError);
        }
        return null;
      }
    } catch (error) {
      console.error('[Auth] Token işleme hatası:', error);
      return null;
    }
  } catch (error) {
    console.error('[Auth] verifyAuthToken fonksiyonunda hata:', error);
    return null;
  }
}

/**
 * Creates a JWT token with consistent settings
 */
export function createAuthToken(payload: object) {
  try {
    // Yayın ve sona erme zamanını ekleyelim
    const now = Math.floor(Date.now() / 1000);
    const enhancedPayload = {
      ...payload,
      iat: now,              // Yayın zamanı (issued at)
      exp: now + (8 * 3600)  // 8 saat sonra sona erme (expires)
    };
    
    const token = sign(enhancedPayload, JWT_SECRET as Secret);
    console.log('[Auth] Token oluşturuldu:', 
      JSON.stringify(enhancedPayload), 
      'token uzunluğu:', token.length, 
      'ilk 10 karakter:', token.substring(0, 10) + '...'
    );
    return token;
  } catch (error) {
    console.error('[Auth] Token oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Decodes a JWT token without verification (for debugging)
 */
export function decodeToken(token: string) {
  if (!token || token.trim() === '') {
    console.log('[Auth] decodeToken fonksiyonuna boş token gönderildi');
    return null;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('[Auth] Geçersiz JWT formatı (3 parça olmalı):', parts.length);
    return null;
  }
  
  try {
    const payload = Buffer.from(parts[1], 'base64').toString();
    return JSON.parse(payload);
  } catch (error) {
    console.error('[Auth] Token decode hatası:', error);
    return null;
  }
} 