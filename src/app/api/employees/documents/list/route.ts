import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme başlığı eksik' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }
    
    // URL'den employeeId parametresini al
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    
    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Çalışan ID belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Çalışanın varlığını kontrol et
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Çalışan bulunamadı' },
        { status: 404 }
      );
    }
    
    // Çalışana ait belgeleri getir
    const documents = await prisma.document.findMany({
      where: { employeeId: employeeId },
      orderBy: { uploadDate: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error('Belge listesi alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Belge listesi alınırken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 