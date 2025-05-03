import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetStatus, AssetCategory } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Prisma tiplerini import et

// GET - Tüm demirbaşları listele (filtreleme ile)
export async function GET(request: NextRequest) {
  console.log('[Assets API] GET isteği alındı.');
  const { searchParams } = new URL(request.url);

  // Filtreleme parametreleri
  const status = searchParams.get('status') as AssetStatus | null;
  const category = searchParams.get('category') as AssetCategory | null;
  const searchQuery = searchParams.get('search');

  const where: Prisma.AssetWhereInput = {};

  if (status) {
    where.status = status;
  }
  if (category) {
    where.category = category;
  }
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { assetTag: { contains: searchQuery, mode: 'insensitive' } },
      { serialNumber: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  try {
    console.log('[Assets API] Veritabanında demirbaşlar aranıyor, filtreler:', where);
    
    // Veritabanı bağlantısını test et
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
    } catch (dbError) {
      console.error('[Assets API] Veritabanı bağlantı hatası:', dbError);
      return NextResponse.json(
        { message: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.' },
        { status: 500 }
      );
    }
    
    const assets = await prisma.asset.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      // Aktif zimmet bilgisini de dahil et (varsa)
      include: {
        assignments: {
          where: { returnDate: null }, // Sadece aktif (iade edilmemiş) zimmetler
          include: {
            employee: {
              select: { id: true, name: true, surname: true }
            }
          }
        }
      }
    });
    
    console.log(`[Assets API] ${assets.length} demirbaş başarıyla çekildi. Yanıt gönderiliyor...`);
    // Log the first asset to check structure (if any)
    if (assets.length > 0) {
      console.log('[Assets API] İlk demirbaş verisi (örnek):', JSON.stringify(assets[0], null, 2));
    }
        
    return NextResponse.json(assets);
  } catch (error) {
    console.error('[Assets API] GET hatası (detaylı):', error instanceof Error ? error.message : 'Bilinmeyen hata', error);
    
    // Daha ayrıntılı hata mesajları
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2001') {
        return NextResponse.json(
          { message: 'Aranan kayıt bulunamadı.' },
          { status: 404 }
        );
      } else if (error.code === 'P2025') {
        return NextResponse.json(
          { message: 'Aranılan kayıt bulunamadı (P2025).' },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          { message: `Veritabanı hatası: ${error.code}. Lütfen sistem yöneticinize başvurun.` },
          { status: 500 }
        );
      }
    }
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { message: 'Veritabanı başlatılamadı. Lütfen sistem yöneticinize başvurun.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Demirbaşlar alınırken bir hata oluştu.', details: error instanceof Error ? error.message : 'Bilinmeyen hata' }, 
      { status: 500 }
    );
  }
}

// POST - Yeni demirbaş oluştur
export async function POST(request: NextRequest) {
  console.log('[Assets API] POST isteği alındı.');
  try {
    const body = await request.json();
    console.log('[Assets API] Gelen veri:', body);

    // Zorunlu alan kontrolü
    if (!body.name || !body.assetTag || !body.category) {
      return NextResponse.json(
        { message: 'Demirbaş adı, etiketi ve kategorisi zorunludur.' }, 
        { status: 400 }
      );
    }

    // AssetTag benzersizlik kontrolü
    const existingAsset = await prisma.asset.findUnique({
      where: { assetTag: body.assetTag },
    });
    if (existingAsset) {
       return NextResponse.json(
        { message: 'Bu demirbaş etiketi zaten kullanılıyor.' }, 
        { status: 409 } // Conflict
      );
    }

    // Veritabanına kaydet
    const newAsset = await prisma.asset.create({
      data: {
        name: body.name,
        assetTag: body.assetTag,
        category: body.category as AssetCategory,
        description: body.description,
        serialNumber: body.serialNumber,
        status: body.status as AssetStatus || AssetStatus.AVAILABLE,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost ? new Prisma.Decimal(body.purchaseCost) : null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        location: body.location,
        notes: body.notes,
      },
    });

    console.log('[Assets API] Yeni demirbaş oluşturuldu:', newAsset.id);
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('[Assets API] POST hatası:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Geçersiz JSON formatı.' }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Özellikle serialNumber unique kısıtlaması için
       return NextResponse.json({ message: 'Bu seri numarası zaten mevcut.' }, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Demirbaş oluşturulurken bir hata oluştu.' }, 
      { status: 500 }
    );
  }
} 