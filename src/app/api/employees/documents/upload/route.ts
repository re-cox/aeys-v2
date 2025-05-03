import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Yükleme dizininin varlığını kontrol et ve yoksa oluştur
function ensureUploadDirectoryExists(directoryPath: string) {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch (error) {
    console.error('Yükleme dizini oluşturulurken hata:', error);
    throw new Error('Yükleme dizini oluşturulamadı');
  }
}

export async function POST(request: NextRequest) {
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
    
    // FormData işleme
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const employeeId = formData.get('employeeId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenemedi' },
        { status: 400 }
      );
    }
    
    if (!documentType) {
      return NextResponse.json(
        { success: false, message: 'Belge türü belirtilmedi' },
        { status: 400 }
      );
    }
    
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
    
    // Dosya tipini kontrol et
    const allowedMimeTypes = [
      'application/pdf',                     // PDF
      'image/jpeg', 'image/jpg', 'image/png', // Görseller
      'application/msword',                  // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];
    
    const mimeType = file.type;
    
    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Desteklenmeyen dosya formatı. Lütfen PDF, JPEG, PNG veya DOC/DOCX formatında bir dosya yükleyin.' 
        },
        { status: 400 }
      );
    }
    
    // Dosya boyutunu kontrol et (10MB maksimum)
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dosya boyutu çok büyük. Maksimum dosya boyutu 10MB olmalıdır.' 
        },
        { status: 400 }
      );
    }
    
    // Dosya adı oluştur
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${employeeId}_${timestamp}${fileExtension}`;
    const uploadDir = 'public/uploads/documents';
    const filePath = path.join(uploadDir, fileName);
    
    // Yükleme dizinini oluştur
    ensureUploadDirectoryExists(uploadDir);
    
    // Dosyayı kaydet
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    fs.writeFileSync(filePath, buffer);
    
    // Veritabanına belge kaydı oluştur
    const document = await prisma.document.create({
      data: {
        fileName,
        originalName: file.name,
        filePath: `/uploads/documents/${fileName}`,
        fileSize: file.size,
        mimeType,
        documentType,
        uploadDate: new Date(),
        uploadedById: payload.userId,
        employee: {
          connect: { id: employeeId }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Belge başarıyla yüklendi',
      document
    });
    
  } catch (error) {
    console.error('Belge yüklenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Belge yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 