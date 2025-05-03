import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Token doğrulama
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json(
        { message: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Yetkilendirme başarısız: Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    const employeeId = params.id;

    // Çalışanın var olup olmadığını kontrol et
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Çalışan bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - sadece kendisi veya yönetici erişebilir
    const isAdmin = decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN';
    const isOwnDocument = decoded.userId === employeeId;
    
    if (!isAdmin && !isOwnDocument) {
      return NextResponse.json(
        { message: 'Bu belgelere erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // Çalışana ait belgeleri getir
    const documents = await prisma.document.findMany({
      where: { employeeId },
      orderBy: { uploadDate: 'desc' }
    });

    return NextResponse.json({ 
      success: true,
      documents 
    });
  } catch (error) {
    console.error('Belge listesi getirme hatası:', error);
    return NextResponse.json(
      { message: 'Belgeler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 