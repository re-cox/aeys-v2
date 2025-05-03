import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
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

    // URL'den documentId parametresini al
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'Belge ID belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Belgeyi veritabanından getir
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Belge bulunamadı' },
        { status: 404 }
      );
    }
    
    // Dosyayı disk üzerinden sil
    try {
      const filePath = path.join(process.cwd(), document.filePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Dosya silinirken hata:', fileError);
      // Dosya silme hatası olsa bile veritabanı kaydını silmeye devam et
    }
    
    // Belgeyi veritabanından sil
    await prisma.document.delete({
      where: { id: documentId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Belge başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Belge silinirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Belge silinirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 