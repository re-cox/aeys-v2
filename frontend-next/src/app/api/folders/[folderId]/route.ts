import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: ID'ye göre klasörü getir
export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    console.log(`[Folders API] GET isteği alındı. ID: ${folderId}`);
    
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: true,
        subFolders: true,
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Klasör bulunamadı.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error(`[Folders API] GET hatası (ID: ${params.folderId}):`, error);
    return NextResponse.json(
      { error: 'Klasör yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// PUT: Klasörü güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    console.log(`[Folders API] PUT isteği alındı. ID: ${folderId}`);
    
    const body = await request.json();
    
    // Klasörün varlığını kontrol et
    const existingFolder = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    
    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Klasör bulunamadı.' },
        { status: 404 }
      );
    }
    
    // Döngüsel ilişki kontrolü (bir klasörün kendi alt klasörüne taşınması engellenmelidir)
    if (body.parentId && body.parentId !== existingFolder.parentId) {
      // Kendisini kendi alt klasörü yapmaya çalışıyor mu?
      if (body.parentId === folderId) {
        return NextResponse.json(
          { error: 'Bir klasör kendisinin alt klasörü olamaz.' },
          { status: 400 }
        );
      }
      
      // Döngüsel ilişki kontrolü (tüm alt hiyerarşiyi kontrol et)
      const isCircularReference = await checkCircularReference(folderId, body.parentId);
      if (isCircularReference) {
        return NextResponse.json(
          { error: 'Döngüsel klasör ilişkisi oluşturulamaz.' },
          { status: 400 }
        );
      }
    }
    
    // Klasörü güncelle
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        parentId: body.parentId !== undefined ? (body.parentId || null) : undefined,
      },
      include: {
        parent: true,
      },
    });
    
    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error(`[Folders API] PUT hatası (ID: ${params.folderId}):`, error);
    return NextResponse.json(
      { error: 'Klasör güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// DELETE: Klasörü sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    console.log(`[Folders API] DELETE isteği alındı. ID: ${folderId}`);
    
    // Klasör bilgisini al
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        documents: true,
        subFolders: true,
      },
    });
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Klasör bulunamadı.' },
        { status: 404 }
      );
    }
    
    // Klasörde döküman veya alt klasör varsa silmeyi engelle
    if (folder.documents.length > 0 || folder.subFolders.length > 0) {
      return NextResponse.json(
        { error: 'Klasör içinde döküman veya alt klasörler var. Önce bunları silmelisiniz.' },
        { status: 400 }
      );
    }
    
    // Klasörü sil
    await prisma.folder.delete({
      where: { id: folderId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Folders API] DELETE hatası (ID: ${params.folderId}):`, error);
    return NextResponse.json(
      { error: 'Klasör silinirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// Döngüsel klasör ilişkilerini kontrol etmek için yardımcı fonksiyon
async function checkCircularReference(folderId: string, potentialParentId: string): Promise<boolean> {
  // Potansiyel üst klasörü ve onun tüm üst klasörlerini al
  let currentId = potentialParentId;
  const visitedIds = new Set<string>();
  
  while (currentId) {
    // Zaten ziyaret edildi mi? (döngü var)
    if (visitedIds.has(currentId)) {
      return true;
    }
    
    // Hedef klasör ID'si ile eşleşiyor mu?
    if (currentId === folderId) {
      return true;
    }
    
    visitedIds.add(currentId);
    
    // Bir üst klasöre çık
    const currentFolder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    
    if (!currentFolder || !currentFolder.parentId) {
      break;
    }
    
    currentId = currentFolder.parentId;
  }
  
  return false;
} 