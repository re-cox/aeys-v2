import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Prisma Client import yolu
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Employee } from '@prisma/client'; // Employee tipini import et

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  // Uygulamanın başlamasını engellemek iyi bir pratik olabilir
  // process.exit(1);
}

export async function POST(req: NextRequest) {
  console.log("[API /auth/login] Login request received");
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      console.log("[API /auth/login] Email or password missing");
      return NextResponse.json({ success: false, message: 'E-posta ve şifre zorunludur.' }, { status: 400 });
    }

    console.log(`[API /auth/login] Attempting login for email: ${email}`);

    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      console.log(`[API /auth/login] Employee not found: ${email}`);
      return NextResponse.json({ success: false, message: 'Geçersiz e-posta veya şifre.' }, { status: 401 });
    }

    // Veritabanında şifre alanı null ise (henüz ayarlanmamışsa)
    if (!employee.password) {
        console.log(`[API /auth/login] Password not set for employee: ${email}`);
        // Güvenlik notu: Burada doğrudan "şifre ayarlanmamış" demek yerine genel bir hata mesajı vermek daha iyi olabilir.
        return NextResponse.json({ success: false, message: 'Hesap kurulumu tamamlanmamış veya şifre sıfırlanmış.' }, { status: 401 }); 
    }

    console.log(`[API /auth/login] Comparing password for: ${email}`);
    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      console.log(`[API /auth/login] Invalid password for: ${email}`);
      return NextResponse.json({ success: false, message: 'Geçersiz e-posta veya şifre.' }, { status: 401 });
    }

    // Şifre doğruysa JWT oluştur
    if (!JWT_SECRET) {
      // Bu kontrol yukarıda da var ama burada tekrar olması güvenliği artırır
      console.error("[API /auth/login] JWT_SECRET is missing during token generation.");
      return NextResponse.json({ success: false, message: 'Sunucu yapılandırma hatası.' }, { status: 500 });
    }

    // JWT payload'ına eklenecek kullanıcı bilgileri (şifreyi ASLA eklemeyin)
    const payload = {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      surname: employee.surname,
      position: employee.position,
      // Rol veya izinler eklenebilir
    };

    console.log(`[API /auth/login] Generating JWT for: ${email}`);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // Token 1 gün geçerli

    // Kullanıcı bilgilerini (şifre hariç) ve token'ı döndür
    const { password: _, ...employeeWithoutPassword } = employee;

    console.log(`[API /auth/login] Login successful for: ${email}`);
    return NextResponse.json({
      success: true,
      token,
      employee: employeeWithoutPassword,
    });

  } catch (error: any) {
    console.error("[API /auth/login] Error during login:", error);
    return NextResponse.json({ success: false, message: 'Giriş işlemi sırasında bir sunucu hatası oluştu.' }, { status: 500 });
  }
} 