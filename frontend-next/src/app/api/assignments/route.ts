import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetStatus, PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

// GET - Tüm zimmet kayıtlarını listele (filtreleme ile)
export async function GET(request: NextRequest) {
  console.log('[Assignments API] GET isteği alındı.');
  const { searchParams } = new URL(request.url);

  // Filtreleme parametreleri
  const employeeId = searchParams.get('employeeId');
  const assetId = searchParams.get('assetId');
  const status = searchParams.get('status'); // 'active' veya 'returned'

  const where: Prisma.AssignmentWhereInput = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }
  if (assetId) {
    where.assetId = assetId;
  }
  if (status === 'active') {
    where.returnDate = null; // Sadece aktif zimmetler
  }
  if (status === 'returned') {
    where.returnDate = { not: null }; // Sadece iade edilmiş zimmetler
  }

  try {
    console.log('[Assignments API] Veritabanında zimmetler aranıyor, filtreler:', where);
    
    // Veritabanı bağlantısını test et
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
    } catch (dbError) {
      console.error('[Assignments API] Veritabanı bağlantı hatası:', dbError);
      return NextResponse.json(
        { message: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.' },
        { status: 500 }
      );
    }
    
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        employee: { select: { id: true, name: true, surname: true } },
      },
      orderBy: {
        assignmentDate: 'desc',
      },
    });
    
    console.log(`[Assignments API] ${assignments.length} zimmet kaydı başarıyla çekildi. Yanıt gönderiliyor...`);
    // Log the first assignment to check structure (if any)
    if (assignments.length > 0) {
      console.log('[Assignments API] İlk zimmet verisi (örnek):', JSON.stringify(assignments[0], null, 2));
    }
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('[Assignments API] GET hatası (detaylı):', error instanceof Error ? error.message : 'Bilinmeyen hata', error);
    
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
      { message: 'Zimmet kayıtları alınırken bir hata oluştu.', details: error instanceof Error ? error.message : 'Bilinmeyen hata' }, 
      { status: 500 }
    );
  }
}

// POST - Yeni zimmet oluştur
export async function POST(request: NextRequest) {
  console.log('[Assignments API] POST isteği alındı.');
  try {
    const body = await request.json();
    console.log('[Assignments API] Gelen veri:', body);

    // Zorunlu alan kontrolü
    if (!body.assetId || !body.employeeId || !body.assignmentDate) {
      return NextResponse.json(
        { message: 'Demirbaş ID, Çalışan ID ve Zimmet Tarihi zorunludur.' }, 
        { status: 400 }
      );
    }

    // 1. Demirbaşın varlığını ve durumunu kontrol et
    const asset = await prisma.asset.findUnique({
      where: { id: body.assetId },
    });

    if (!asset) {
      return NextResponse.json({ message: 'Zimmetlenecek demirbaş bulunamadı.' }, { status: 404 });
    }
    if (asset.status !== AssetStatus.AVAILABLE) {
      return NextResponse.json({ message: `Bu demirbaş şu anda zimmete uygun değil (Durum: ${asset.status}).` }, { status: 409 });
    }

    // 2. Çalışanın varlığını kontrol et (opsiyonel ama önerilir)
    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId },
    });
    if (!employee) {
      return NextResponse.json({ message: 'Zimmet yapılacak çalışan bulunamadı.' }, { status: 404 });
    }

    // 3. Zimmet kaydını oluştur ve demirbaş durumunu güncelle (transaction içinde)
    const newAssignment = await prisma.$transaction(async (tx: PrismaClient) => {
      // Yeni zimmet kaydı oluştur
      const assignment = await tx.assignment.create({
        data: {
          assetId: body.assetId,
          employeeId: body.employeeId,
          assignmentDate: new Date(body.assignmentDate),
          expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
          notes: body.notes,
        },
        include: { // Oluşturulan kaydı ilişkilerle döndür
          asset: true,
          employee: true,
        },
      });

      // Demirbaşın durumunu 'ASSIGNED' (Zimmetli) olarak güncelle
      await tx.asset.update({
        where: { id: body.assetId },
        data: { status: AssetStatus.ASSIGNED },
      });

      return assignment;
    });

    console.log('[Assignments API] Yeni zimmet kaydı oluşturuldu:', newAssignment.id);
    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error('[Assignments API] POST hatası:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Geçersiz JSON formatı.' }, { status: 400 });
    }
     // Diğer potansiyel Prisma hataları (örn: Foreign Key constraint)
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
       if (error.code === 'P2003') { // Foreign key constraint failed
          return NextResponse.json({ message: 'Geçersiz demirbaş veya çalışan ID.' }, { status: 400 });
       }
     }
    return NextResponse.json(
      { message: 'Zimmet oluşturulurken bir hata oluştu.' }, 
      { status: 500 }
    );
  }
} 