import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';

// GET: ID'ye göre dokümanı getir
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    console.log(`[Documents API] GET isteği alındı. ID: ${documentId}`);
    
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Doküman bulunamadı.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error(`[Documents API] GET hatası (ID: ${params.documentId}):`, error);
    return NextResponse.json(
      { error: 'Doküman yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// PUT: Dokümanı güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    console.log(`[Documents API] PUT isteği alındı. ID: ${documentId}`);
    
    const body = await request.json();
    
    // Dokümanın varlığını kontrol et
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });
    
    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Doküman bulunamadı.' },
        { status: 404 }
      );
    }
    
    // Sadece gelen alanları güncelle
    const updateData: Prisma.DocumentUpdateInput = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    
    // Dokümanı güncelle
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error(`[Documents API] PUT hatası (ID: ${params.documentId}):`, error);
    return NextResponse.json(
      { error: 'Doküman güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// DELETE: Dokümanı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    console.log(`[Documents API] DELETE isteği alındı. ID: ${documentId}`);
    
    // Doküman bilgisini al
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Doküman bulunamadı.' },
        { status: 404 }
      );
    }
    
    // Dokümanı sil
    await prisma.document.delete({
      where: { id: documentId },
    });
    
    // Eğer fileUrl public/uploads/ dizini altında bir dosyayı gösteriyorsa, dosyayı da sil
    if (document.fileUrl && document.fileUrl.includes('/uploads/')) {
      try {
        const filePath = path.join(
          process.cwd(),
          'public',
          document.fileUrl.replace(/^\//, '') // Başındaki / işaretini kaldır
        );
        
        console.log(`[Documents API] Dosya siliniyor: ${filePath}`);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[Documents API] Dosya silindi: ${filePath}`);
        }
      } catch (fsError) {
        console.error(`[Documents API] Dosya silinirken hata oluştu:`, fsError);
        // Dosya silme hatası olsa bile, veritabanı kaydı silindi, işleme devam ediyoruz
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Documents API] DELETE hatası (ID: ${params.documentId}):`, error);
    return NextResponse.json(
      { error: 'Doküman silinirken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 