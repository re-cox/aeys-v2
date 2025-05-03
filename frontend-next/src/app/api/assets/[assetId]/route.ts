import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetStatus, AssetCategory, Prisma } from '@prisma/client';

interface Params {
  params: {
    assetId: string;
  };
}

// GET - Belirli bir demirbaşı getir
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { assetId } = params;
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        assignments: { // Tüm zimmet geçmişi
          include: {
            employee: { select: { id: true, name: true, surname: true } }
          },
          orderBy: {
            assignmentDate: 'desc'
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Demirbaş bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    console.error("Demirbaş getirme hatası (ID):", error);
    return NextResponse.json({ error: 'Demirbaş alınamadı' }, { status: 500 });
  }
}

// PUT - Demirbaşı güncelle
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { assetId } = params;
    const body = await req.json();

    // AssetTag veya SerialNumber değişirse benzersizlik kontrolü
    if(body.assetTag){
      const existingTag = await prisma.asset.findFirst({
          where: { 
              assetTag: body.assetTag,
              id: { not: assetId } // Kendisi hariç
          }
      });
      if(existingTag){
           return NextResponse.json({ message: 'Bu demirbaş etiketi başka bir demirbaşa ait.' }, { status: 409 });
      }
    }
     if(body.serialNumber){
      const existingSerial = await prisma.asset.findFirst({
          where: { 
              serialNumber: body.serialNumber,
              id: { not: assetId } // Kendisi hariç
          }
      });
       if(existingSerial){
           return NextResponse.json({ message: 'Bu seri numarası başka bir demirbaşa ait.' }, { status: 409 });
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name: body.name,
        assetTag: body.assetTag,
        category: body.category as AssetCategory,
        description: body.description,
        serialNumber: body.serialNumber,
        status: body.status as AssetStatus,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost ? new Prisma.Decimal(body.purchaseCost) : null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        location: body.location,
        notes: body.notes,
      },
       include: { // Güncellenen veriyi ilişkilerle döndür
        assignments: {
          include: {
            employee: { select: { id: true, name: true, surname: true } }
          },
          orderBy: {
            assignmentDate: 'desc'
          }
        }
      }
    });
    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Demirbaş güncelleme hatası:", error);
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Güncellenecek demirbaş bulunamadı' }, { status: 404 });
    }
    if (error.code === 'P2002') { // Unique constraint violation
       return NextResponse.json({ message: 'Demirbaş etiketi veya seri numarası zaten kullanılıyor.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Demirbaş güncellenemedi' }, { status: 500 });
  }
}

// DELETE - Demirbaşı sil
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { assetId } = params;

    // Demirbaşın aktif bir zimmeti var mı kontrol et?
    const activeAssignment = await prisma.assignment.findFirst({
      where: {
        assetId: assetId,
        returnDate: null // İade edilmemiş zimmet
      }
    });

    if(activeAssignment){
        return NextResponse.json(
            { error: 'Demirbaş şu anda bir personele zimmetli olduğu için silinemez. Önce zimmeti sonlandırın.' }, 
            { status: 409 } // Conflict
        );
    }

    // Aktif zimmet yoksa sil (İlişkili eski zimmet kayıtları da silinecek - cascade değilse manuel silinmeli)
    // Prisma şemasında Assignment.asset ilişkisinde onDelete belirtilmediği için
    // önce ilişkili zimmet kayıtlarını silmek daha güvenli olabilir.
     await prisma.assignment.deleteMany({ // Önce tüm (eski) zimmet kayıtlarını sil
        where: { assetId: assetId },
     });

    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ message: 'Demirbaş başarıyla silindi' });
  } catch (error: any) {
    console.error("Demirbaş silme hatası:", error);
     if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Silinecek demirbaş bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Demirbaş silinemedi' }, { status: 500 });
  }
} 