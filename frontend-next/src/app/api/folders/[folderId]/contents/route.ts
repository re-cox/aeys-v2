import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET: Klasör içeriğini getir (alt klasörler ve dokümanlar)
export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const folderId = params.folderId;
  console.log(`[Folders API] Contents GET isteği alındı. ID: ${folderId}`);

  try {
    // Veritabanı bağlantısını test et
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('[Folders API] Veritabanı bağlantısı başarılı.');
    } catch (connError) {
      console.error('[Folders API] Veritabanı bağlantı hatası:', connError);
      return NextResponse.json(
        { 
          error: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.',
          details: connError instanceof Error ? connError.message : 'Bilinmeyen bağlantı hatası',
          folders: [],
          documents: []
        },
        { status: 500 }
      );
    }

    // Önce klasör varlığını kontrol et (root hariç)
    if (folderId !== 'root') {
      try {
        const folderExists = await prisma.folder.findUnique({
          where: { id: folderId }
        });
        
        if (!folderExists) {
          console.log(`[Folders API] Klasör bulunamadı. ID: ${folderId}`);
          return NextResponse.json(
            { 
              error: 'Belirtilen klasör bulunamadı.',
              folders: [],
              documents: []
            },
            { status: 404 }
          );
        }
      } catch (folderCheckError) {
        console.error(`[Folders API] Klasör kontrolü sırasında hata:`, folderCheckError);
        return NextResponse.json(
          { 
            error: 'Klasör kontrolü sırasında bir hata oluştu.',
            details: folderCheckError instanceof Error ? folderCheckError.message : 'Bilinmeyen hata',
            folders: [],
            documents: []
          },
          { status: 500 }
        );
      }
    }

    let subFolders = [];
    let documents = [];

    // Alt klasörleri getir
    try {
      console.log(`[Folders API] Alt klasörler aranıyor. Parent ID: ${folderId === 'root' ? null : folderId}`);
      subFolders = await prisma.folder.findMany({
        where: { 
          parentId: folderId === 'root' ? null : folderId
        },
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              documents: true,
              subFolders: true
            }
          }
        }
      });
      console.log(`[Folders API] ${subFolders.length} alt klasör bulundu.`);
    } catch (folderError) {
      console.error(`[Folders API] Alt klasörler alınırken hata (Parent ID: ${folderId}):`, folderError);
      
      // Alt klasörler hatası için ayrı yanıt
      return NextResponse.json(
        { 
          error: 'Alt klasörler yüklenirken bir hata oluştu.',
          details: folderError instanceof Error ? folderError.message : 'Bilinmeyen hata',
          errorType: 'subFolders',
          folders: [],
          documents: []
        },
        { status: 500 }
      );
    }

    // Dokümanları getir
    try {
      console.log(`[Folders API] Dokümanlar aranıyor. Folder ID: ${folderId === 'root' ? null : folderId}`);
      documents = await prisma.document.findMany({
        where: { 
          folderId: folderId === 'root' ? null : folderId
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });
      console.log(`[Folders API] ${documents.length} doküman bulundu.`);
    } catch (docError) {
      console.error(`[Folders API] Dokümanlar alınırken hata (Folder ID: ${folderId}):`, docError);
      
      // Dokümanlar hatası için ayrı yanıt
      return NextResponse.json(
        { 
          error: 'Dokümanlar yüklenirken bir hata oluştu.',
          details: docError instanceof Error ? docError.message : 'Bilinmeyen hata',
          errorType: 'documents',
          // En azından klasörleri döndür
          folders: subFolders,
          documents: []
        },
        { status: 500 }
      );
    }

    console.log(`[Folders API] Klasör içeriği başarıyla alındı. ID: ${folderId}`);
    // Başarılı yanıt
    return NextResponse.json({
      folders: subFolders,
      documents: documents
    });

  } catch (error) {
    console.error(`[Folders API] Genel Contents GET hatası (ID: ${folderId}):`, error);
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { 
          error: 'Veritabanı başlatılamadı. Lütfen sistem yöneticinize başvurun.',
          details: error.message,
          folders: [],
          documents: []
        },
        { status: 500 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: 'Veritabanı isteği sırasında bir hata oluştu.',
          details: error.message,
          code: error.code,
          folders: [],
          documents: []
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Klasör içeriği yüklenirken genel bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        folders: [],
        documents: []
      },
      { status: 500 }
    );
  }
} 