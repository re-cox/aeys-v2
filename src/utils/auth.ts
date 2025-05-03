import jwt from 'jsonwebtoken';

/**
 * JWT token doğrulama fonksiyonu
 * @param token JWT token string
 * @returns Çözülmüş token verisi veya hata durumunda null
 */
export const verifyToken = (token: string): any => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return null;
  }
}; 