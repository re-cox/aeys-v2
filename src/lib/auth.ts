import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Gelen istekten tokeni çıkarıp doğrular
 * @param request NextRequest - İşlenecek istek
 * @returns {Promise<any>} - Token geçerliyse token verisi, değilse null
 */
export async function validateToken(request: NextRequest): Promise<any> {
  try {
    // İstekten tokeni al
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;

    if (!token) {
      return null;
    }

    // JWT secret key'i ortam değişkenlerinden al
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH] JWT_SECRET ortam değişkeni tanımlanmamış');
      return null;
    }

    // Tokeni doğrula
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    console.error('[AUTH] Token doğrulama hatası:', error);
    return null;
  }
} 