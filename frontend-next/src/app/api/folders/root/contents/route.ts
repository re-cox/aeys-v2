import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Kök klasörün içeriğini getir (ana klasörler ve dokümanlar)
export async function GET(request: NextRequest) {
  try {
    console.log(`[Folders Root API] Kök klasör içeriği GET isteği alındı.`);
    
    // Ana klasörleri getir (parentId null olanlar)
    const rootFolders = await prisma.folder.findMany({
      where: { 
        parentId: null
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
    
    // Hiçbir klasöre ait olmayan dokümanları getir
    const rootDocuments = await prisma.document.findMany({
      where: { 
        folderId: null
      },
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
    });
    
    return NextResponse.json({
      folders: rootFolders,
      documents: rootDocuments
    });
  } catch (error) {
    console.error(`[Folders Root API] Kök klasör içeriği GET hatası:`, error);
    return NextResponse.json(
      { 
        error: 'Klasör içeriği yüklenirken bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        folders: [],
        documents: []
      },
      { status: 500 }
    );
  }
} 