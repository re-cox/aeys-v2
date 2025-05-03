import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateToken } from '@/utils/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası: Geçersiz token formatı' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tokenData = validateToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası: Geçersiz token' },
        { status: 401 }
      );
    }

    // Query parametrelerini al
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Çalışan ID parametresi gereklidir' },
        { status: 400 }
      );
    }

    // Çalışanın belgelerini getir
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employeeId: employeeId
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });

    return NextResponse.json(
      { success: true, data: documents },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Belge listesi getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: `Belgeler getirilirken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
} 