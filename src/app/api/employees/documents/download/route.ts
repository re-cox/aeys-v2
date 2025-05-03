import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Belge indirme API endpoint'i
 * @route GET /api/employees/documents/download?documentId=:id
 * @access Private - Yetkilendirme gerektirir
 */
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

    // URL'den belge ID'sini al
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'Belge ID parametresi eksik' },
        { status: 400 }
      );
    }

    // Belgeyi veritabanından sorgula
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { employee: true }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Belge bulunamadı' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - Admin veya belgenin sahibi olmalı
    const isAdmin = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN';
    const isOwner = document.employeeId === payload.userId;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Bu belgeyi indirmek için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Dosyanın tam yolunu oluştur
    const filePath = path.join(process.cwd(), document.filePath);
    
    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'Dosya fiziksel olarak bulunamadı' },
        { status: 404 }
      );
    }

    // Dosyayı oku
    const fileBuffer = fs.readFileSync(filePath);
    
    // Dosya içeriğini binary olarak dön
    const response = new NextResponse(fileBuffer);

    // Content-Type başlığını belge MIME türüne göre ayarla
    response.headers.set('Content-Type', document.mimeType || 'application/octet-stream');
    
    // İndirilebilir olmasını sağla
    response.headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`);
    
    // Dosya boyutunu belirt
    response.headers.set('Content-Length', document.fileSize.toString());

    return response;
    
  } catch (error) {
    console.error('Belge indirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Belge indirilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 