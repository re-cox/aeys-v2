import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetStatus } from '@prisma/client';

interface Params {
  params: {
    assignmentId: string;
  };
}

// GET - Belirli bir zimmet kaydını getir
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { assignmentId } = params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        asset: true,
        employee: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Zimmet kaydı bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Zimmet getirme hatası (ID):", error);
    return NextResponse.json({ error: 'Zimmet kaydı alınamadı' }, { status: 500 });
  }
}

// PUT - Zimmeti güncelle (özellikle iade için)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { assignmentId } = params;
    const body = await req.json();
    console.log(`[Assignments API] PUT isteği alındı. ID: ${assignmentId}, Body:`, body);

    // Şu anki zimmet kaydını bul
    const currentAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Güncellenecek zimmet kaydı bulunamadı' }, { status: 404 });
    }

    // --- Zimmet Sonlandırma (İade) Mantığı ---
    if (body.returnDate && !currentAssignment.returnDate) {
      console.log(`[Assignments API] Zimmet sonlandırma işlemi: ${assignmentId}`);
      const returnDate = new Date(body.returnDate);

      // Transaction: Zimmeti güncelle ve demirbaş durumunu 'AVAILABLE' yap
      const updatedAssignment = await prisma.$transaction(async (tx) => {
        const assignment = await tx.assignment.update({
          where: { id: assignmentId },
          data: {
            returnDate: returnDate,
            notes: body.notes || currentAssignment.notes, // Notları güncelle veya koru
          },
          include: { asset: true, employee: true },
        });

        // Demirbaş durumunu AVAILABLE yap
        await tx.asset.update({
          where: { id: assignment.assetId },
          data: { status: AssetStatus.AVAILABLE },
        });

        return assignment;
      });
       console.log(`[Assignments API] Zimmet başarıyla sonlandırıldı: ${assignmentId}`);
       return NextResponse.json(updatedAssignment);
    }
    // --- Sadece Not Güncelleme Mantığı ---
    else if (body.notes !== undefined) {
        console.log(`[Assignments API] Zimmet notu güncelleme işlemi: ${assignmentId}`);
         const updatedAssignment = await prisma.assignment.update({
             where: { id: assignmentId },
             data: {
                 notes: body.notes,
             },
             include: { asset: true, employee: true },
         });
         console.log(`[Assignments API] Zimmet notu güncellendi: ${assignmentId}`);
         return NextResponse.json(updatedAssignment);
    }
    // --- Diğer Güncellemelere İzin Verme (şimdilik) ---
    else {
         console.log(`[Assignments API] Geçersiz güncelleme isteği (sadece iade veya not): ${assignmentId}`);
         return NextResponse.json({ error: 'Şu anda sadece zimmet iadesi veya not güncellemesi yapılabilir.' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error("Zimmet güncelleme hatası:", error);
    // Type guard for Prisma known errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code?: string };
       if (prismaError.code === 'P2025') { // Record to update not found
         return NextResponse.json({ error: 'Güncellenecek zimmet kaydı bulunamadı' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: 'Zimmet güncellenemedi' }, { status: 500 });
  }
}

// DELETE - Zimmet kaydını sil (Genellikle önerilmez, iade edilmeli)
// Silme işlemi yerine iade (PUT) kullanılması daha doğrudur.
// Ancak ihtiyaç olursa diye eklenmiştir.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { assignmentId } = params;
    console.warn(`[Assignments API] DELETE isteği alındı (Genellikle önerilmez): ${assignmentId}`);

    // Veritabanı bağlantısını test et
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
    } catch (connError) {
      console.error('[Assignments API] Veritabanı bağlantı hatası:', connError);
      return NextResponse.json(
        { error: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.' },
        { status: 500 }
      );
    }

    // Zimmet kaydını bul (ve ilişkili demirbaşı al)
    const assignmentToDelete = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { asset: true }
    });

    if (!assignmentToDelete) {
      console.error(`[Assignments API] Silinecek zimmet bulunamadı, ID: ${assignmentId}`);
      return NextResponse.json({ error: 'Silinecek zimmet kaydı bulunamadı' }, { status: 404 });
    }

    console.log(`[Assignments API] Silinecek zimmet kaydı bulundu: ${assignmentId}, Demirbaş: ${assignmentToDelete.asset.name}`);

    // Eğer zimmet aktifse (iade edilmemişse) ve demirbaş hala ASSIGNED ise,
    // demirbaşın durumunu AVAILABLE yapmayı düşünebiliriz.
    const needsStatusUpdate = !assignmentToDelete.returnDate && assignmentToDelete.asset.status === AssetStatus.ASSIGNED;

    try {
      await prisma.$transaction(async (tx) => {
        // Zimmet kaydını sil
        await tx.assignment.delete({ where: { id: assignmentId } });
        console.log(`[Assignments API] Zimmet kaydı silindi: ${assignmentId}`);

        // Gerekirse demirbaş durumunu güncelle
        if (needsStatusUpdate) {
          console.log(`[Assignments API] Zimmet silindiği için demirbaş (${assignmentToDelete.assetId}) durumu AVAILABLE yapılıyor.`);
          await tx.asset.update({
            where: { id: assignmentToDelete.assetId },
            data: { status: AssetStatus.AVAILABLE },
          });
          console.log(`[Assignments API] Demirbaş durumu AVAILABLE olarak güncellendi: ${assignmentToDelete.assetId}`);
        }
      });

      console.log(`[Assignments API] Zimmet silme işlemi başarıyla tamamlandı: ${assignmentId}`);
      return NextResponse.json({ 
        message: 'Zimmet kaydı başarıyla silindi',
        id: assignmentId
      });
    } catch (txError) {
      console.error(`[Assignments API] Zimmet silme transaction hatası:`, txError);
      return NextResponse.json({ 
        error: 'Zimmet silinirken bir hata oluştu.', 
        details: txError instanceof Error ? txError.message : 'Bilinmeyen hata' 
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Zimmet silme hatası:", error);
    // Type guard for Prisma known errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code?: string; message?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Silinecek zimmet kaydı bulunamadı' }, { status: 404 });
      } else if (prismaError.code === 'P2003') {
        return NextResponse.json({ 
          error: 'Bu zimmet ilişkili kayıtlar nedeniyle silinemiyor.', 
          details: 'İlişkili verileri önce güncellemeniz gerekebilir.'
        }, { status: 409 });
      } else {
        return NextResponse.json({ 
          error: 'Veritabanı hatası', 
          details: prismaError.message || `Veritabanı hatası: ${prismaError.code}`
        }, { status: 500 });
      }
    }
    return NextResponse.json({ 
      error: 'Zimmet kaydı silinemedi', 
      details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }, { status: 500 });
  }
}