import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST - Doküman yükleme
export async function POST(req: NextRequest) {
  try {
    // multipart/form-data işleme
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const raporId = formData.get('raporId') as string;
    const yuklayanId = formData.get('yuklayanId') as string;
    
    if (!file || !raporId || !yuklayanId) {
      return NextResponse.json(
        { error: 'Dosya, rapor ID veya yükleyen ID eksik' },
        { status: 400 }
      );
    }
    
    // Raporun var olup olmadığını kontrol et
    const rapor = await prisma.teknisyenRaporu.findUnique({
      where: { id: raporId },
    });
    
    if (!rapor) {
      return NextResponse.json(
        { error: 'Belirtilen rapor bulunamadı' },
        { status: 404 }
      );
    }
    
    // Dosya bilgilerini al
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Yükleme klasörünü oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'teknisyen-dokumanlar');
    await mkdir(uploadDir, { recursive: true });
    
    // Benzersiz dosya adı oluştur
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Dosyayı diske kaydet
    await writeFile(filePath, buffer);
    
    // Veritabanına doküman kaydı ekle
    const dokuman = await prisma.teknisyenDokuman.create({
      data: {
        dosyaAdi: file.name,
        dosyaUrl: `/uploads/teknisyen-dokumanlar/${fileName}`,
        dosyaTipu: file.type,
        dosyaBoyutu: file.size,
        raporId: raporId,
        yuklayanId: yuklayanId,
      },
    });
    
    // Frontend modeline dönüştür
    const formattedDokuman = {
      id: dokuman.id,
      dosyaAdi: dokuman.dosyaAdi,
      dosyaYolu: dokuman.dosyaUrl,
      dosyaTipu: dokuman.dosyaTipu,
      dosyaBoyutu: dokuman.dosyaBoyutu,
      yuklemeTarihi: dokuman.createdAt.toISOString(),
      raporId: dokuman.raporId,
    };
    
    return NextResponse.json(formattedDokuman, { status: 201 });
  } catch (error) {
    console.error('Doküman yüklenirken hata:', error);
    return NextResponse.json(
      { error: 'Doküman yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 