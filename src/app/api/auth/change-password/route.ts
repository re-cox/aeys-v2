import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// JWT doğrulama fonksiyonu (yardımcı)
const verifyToken = (token: string | null): { userId: string } | null => {
  if (!token || !JWT_SECRET) {
    return null;
  }
  try {
    // Token'ı doğrula ve payload'u çöz
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }; // Payload'daki kullanıcı ID'si
    return { userId: decoded.id };
  } catch (error) {
    console.error("[API Auth] Invalid token:", error);
    return null;
  }
};

const saltRounds = 10;

export async function POST(req: NextRequest) {
  console.log("[API /auth/change-password] Request received");
  try {
    // Token'ı doğrula
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // Bearer token
    const decodedToken = verifyToken(token || null);

    if (!decodedToken) {
      console.log("[API /auth/change-password] Invalid or missing token");
      return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { userId, currentPassword, newPassword } = await req.json();

    // Token'daki userId ile istekteki userId eşleşmeli (güvenlik için)
    if (decodedToken.userId !== userId) {
        console.log(`[API /auth/change-password] Token userId (${decodedToken.userId}) does not match request userId (${userId})`);
        return NextResponse.json({ success: false, message: 'Yetkisiz işlem.' }, { status: 403 }); // Forbidden
    }

    if (!userId || !currentPassword || !newPassword) {
      console.log("[API /auth/change-password] Missing required fields");
      return NextResponse.json({ success: false, message: 'Kullanıcı ID, mevcut şifre ve yeni şifre zorunludur.' }, { status: 400 });
    }

    console.log(`[API /auth/change-password] Attempting password change for user: ${userId}`);

    const employee = await prisma.employee.findUnique({
      where: { id: userId },
    });

    if (!employee) {
      console.log(`[API /auth/change-password] Employee not found: ${userId}`);
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Mevcut şifre kontrolü (eğer kullanıcı daha önce şifre belirlemişse)
    if (!employee.password) {
        console.log(`[API /auth/change-password] User ${userId} does not have a password set.`);
        // Bu durum normalde olmamalı ama güvenlik için kontrol edelim
        return NextResponse.json({ success: false, message: 'Mevcut şifre bulunamadı. Yönetici ile iletişime geçin.' }, { status: 400 });
    }

    console.log(`[API /auth/change-password] Comparing current password for user: ${userId}`);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);

    if (!isCurrentPasswordValid) {
      console.log(`[API /auth/change-password] Invalid current password for user: ${userId}`);
      return NextResponse.json({ success: false, message: 'Mevcut şifre yanlış.' }, { status: 401 });
    }

    // Yeni şifreyi hash'le
    console.log(`[API /auth/change-password] Hashing new password for user: ${userId}`);
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Veritabanında güncelle
    await prisma.employee.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        // passwordResetRequired: false, // Eğer bu alan kullanılsaydı burada false yapılırdı
      },
    });

    console.log(`[API /auth/change-password] Password successfully changed for user: ${userId}`);
    return NextResponse.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });

  } catch (error: any) {
    console.error("[API /auth/change-password] Error changing password:", error);
    // Veritabanı veya başka bir hata
    return NextResponse.json({ success: false, message: 'Şifre değiştirme sırasında bir sunucu hatası oluştu.' }, { status: 500 });
  }
} 