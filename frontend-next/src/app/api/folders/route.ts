import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET: Tüm klasörleri listele
export async function GET(request: NextRequest) {
  try {
    console.log('[Folders API] GET isteği alındı.');
    
    // URL parametrelerini al (filtreleme için)
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const parentId = searchParams.get('parentId');
    
    // Filtreleme koşulları
    const where: Prisma.FolderWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (parentId === 'root' || parentId === 'null') {
      // Kök klasörleri getir (parentId null olanlar)
      where.parentId = null;
    } else if (parentId) {
      // Belirli bir üst klasörün alt klasörlerini getir
      where.parentId = parentId;
    }
    
    // Klasörleri getir
    const folders = await prisma.folder.findMany({
      where,
      include: {
        subFolders: true,
        _count: {
          select: {
            documents: true,
            subFolders: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(folders);
  } catch (error) {
    console.error('[Folders API] GET hatası:', error);
    return NextResponse.json(
      { error: 'Klasörler yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// POST: Yeni klasör oluştur
export async function POST(request: NextRequest) {
  try {
    console.log('[Folders API] POST isteği alındı.');
    
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.name) {
      return NextResponse.json(
        { error: 'Klasör adı belirtmelisiniz.' },
        { status: 400 }
      );
    }
    
    // Klasörü oluştur
    const folder = await prisma.folder.create({
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error('[Folders API] POST hatası:', error);
    return NextResponse.json(
      { error: 'Klasör oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 