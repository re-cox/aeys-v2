import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

// Şifre hashlemesi için
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Şifre karşılaştırması için
export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWT token oluşturma
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "24h", // 24 saat geçerli token
  });
};

// JWT token doğrulama
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    // console.error('Token doğrulama hatası:', error); // Hata loglaması middleware içinde yapılıyor
    return null;
  }
}; 