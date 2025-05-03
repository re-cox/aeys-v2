import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

// Initialize Prisma client
const prisma = new PrismaClient();

// JWT secret should be in env vars in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Yetkilendirme tokeni gereklidir." },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Mevcut şifre ve yeni şifre gereklidir." },
        { status: 400 }
      );
    }
    
    // Find employee by id from token
    const employee = await prisma.employee.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    // Validate current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      employee.password || ""
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Mevcut şifre yanlış." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.employee.update({
      where: { id: employee.id },
      data: { password: passwordHash },
    });

    return NextResponse.json({
      message: "Şifre başarıyla değiştirildi.",
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { message: "Geçersiz token." },
        { status: 401 }
      );
    }
    
    console.error("Password change error:", error);
    return NextResponse.json(
      { message: "Şifre değiştirme işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
} 