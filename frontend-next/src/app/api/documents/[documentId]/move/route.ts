import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Dokümanı başka bir klasöre taşı
export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    console.log(`[Documents API] MOVE isteği alındı. ID: ${documentId}`);
    
    const body = await request.json();
    const folderId = body.folderId; // null olabilir (kök klasöre taşımak için)
    
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
    
    // Hedef klasörün varlığını kontrol et (eğer folderId null değilse)
    if (folderId !== null) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      
      if (!targetFolder) {
        return NextResponse.json(
          { error: 'Hedef klasör bulunamadı.' },
          { status: 404 }
        );
      }
    }
    
    // Dokümanı güncelle
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        folderId: folderId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error(`[Documents API] MOVE hatası (ID: ${params.documentId}):`, error);
    return NextResponse.json(
      { error: 'Doküman taşınırken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 