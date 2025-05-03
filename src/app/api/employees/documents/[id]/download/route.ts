import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateToken } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const documentId = params.id;
    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'Belge ID eksik' },
        { status: 400 }
      );
    }

    // Belgeyi veritabanından bul
    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
      include: { employee: true }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Belge bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü: Sadece belgenin sahibi veya admin görebilir
    if (tokenData.role !== 'ADMIN' && tokenData.id !== document.employee.userId) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // Dosya yolunu oluştur
    const filePath = path.join(process.cwd(), 'public', document.filePath);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'Dosya bulunamadı' },
        { status: 404 }
      );
    }

    // Dosyayı oku ve akış olarak gönder
    const fileBuffer = fs.readFileSync(filePath);
    
    // Response headers
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', document.mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    
    return response;

  } catch (error: any) {
    console.error('Belge indirme hatası:', error);
    return NextResponse.json(
      { success: false, message: `Belge indirilirken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
} 