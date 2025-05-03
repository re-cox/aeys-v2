import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-utils';
import { JwtPayload } from 'jsonwebtoken';

// Define interface for our token payload
interface AuthTokenPayload extends JwtPayload {
  employeeId?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify token with detailed logging
    console.log('[Auth] /me endpoint: Gelen istek başlıkları:', Object.fromEntries([...request.headers.entries()]));
    const authHeader = request.headers.get('authorization');
    console.log('[Auth] /me endpoint: Authorization başlığı:', authHeader ? `${authHeader.substring(0, 15)}...` : 'yok');
    
    // verifyAuthToken is an async function, we need to await it
    const token = await verifyAuthToken(request);
    
    if (!token) {
      console.log('[Auth] /me endpoint: Token doğrulanamadı veya bulunamadı');
      return NextResponse.json(
        { success: false, message: 'Unauthorized', details: 'Geçersiz veya eksik token' },
        { status: 401 }
      );
    }

    // Cast token to our typed interface
    const typedToken = token as JwtPayload & { employeeId?: string };
    
    if (!typedToken.employeeId) {
      console.log('[Auth] /me endpoint: Token içinde employeeId bulunamadı', JSON.stringify(typedToken));
      return NextResponse.json(
        { success: false, message: 'Invalid token structure', details: 'Token içinde employeeId bilgisi yok' },
        { status: 401 }
      );
    }

    console.log(`[Auth] /me endpoint: Çalışan ID ile sorgu yapılıyor: ${typedToken.employeeId}`);

    // Find the employee
    const employee = await prisma.employee.findUnique({
      where: {
        id: typedToken.employeeId,
      },
      include: {
        department: true,
      },
    });

    if (!employee) {
      console.log(`[Auth] /me endpoint: ${typedToken.employeeId} ID'li çalışan bulunamadı`);
      return NextResponse.json(
        { success: false, message: 'Employee not found', details: 'Belirtilen ID ile çalışan bulunamadı' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password, ...employeeWithoutPassword } = employee;

    console.log('[Auth] /me endpoint: Çalışan bilgileri başarıyla döndürülüyor');
    return NextResponse.json({
      success: true,
      employee: employeeWithoutPassword,
    });
  } catch (error) {
    console.error('[Auth] /me endpoint: Hata oluştu:', error);
    
    // Provide a more descriptive error message
    let errorMessage = 'Internal server error';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.name;
      errorDetails = error.message;
      console.error('[Auth] /me endpoint: Hata detayları:', error.message);
      
      if (error.stack) {
        console.error('[Auth] /me endpoint: Stack:', error.stack);
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage, 
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 