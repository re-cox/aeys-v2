import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

// Token içeriği için arayüz tanımı
interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
  email?: string;
}

// Token doğrulama fonksiyonu
export function validateToken(token: string): TokenPayload | null {
  try {
    // JWT_SECRET değeri .env dosyasından alınmalı
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';
    
    // Token doğrula ve içeriği çöz
    const decoded = jwt.verify(token, JWT_SECRET as Secret) as TokenPayload;
    
    return decoded;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return null;
  }
}

// Kullanıcı rolünü kontrol eden yardımcı fonksiyon
export function hasRole(token: string, requiredRole: string): boolean {
  const userData = validateToken(token);
  
  if (!userData || !userData.role) {
    return false;
  }
  
  return userData.role === requiredRole;
}

// Admin rolünü kontrol et
export function isAdmin(token: string): boolean {
  return hasRole(token, 'ADMIN');
}

// Token oluşturma fonksiyonu (genellikle backend'de kullanılır)
export function createToken(payload: Record<string, any>, expiresIn: string = '1d'): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET as Secret, options);
} 