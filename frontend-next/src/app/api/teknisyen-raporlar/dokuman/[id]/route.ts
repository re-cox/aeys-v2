import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// DELETE - Doküman silme
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Dokümanın var olup olmadığını kontrol et
    const dokuman = await prisma.teknisyenDokuman.findUnique({
      where: { id },
    });
    
    if (!dokuman) {
      return NextResponse.json(
        { error: 'Belirtilen doküman bulunamadı' },
        { status: 404 }
      );
    }
    
    // Dosyayı diskten sil
    try {
      const filePath = path.join(process.cwd(), 'public', dokuman.dosyaUrl);
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      console.error('Dosya silinirken hata:', fileError);
      // Dosya silinirken hata oluşsa bile veritabanındaki kaydı silmeye devam et
    }
    
    // Veritabanından dokümanı sil
    await prisma.teknisyenDokuman.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Doküman başarıyla silindi' });
  } catch (error) {
    console.error('Doküman silinirken hata:', error);
    return NextResponse.json(
      { error: 'Doküman silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 