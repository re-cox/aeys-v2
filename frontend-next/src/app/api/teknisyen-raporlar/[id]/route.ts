import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Belirli bir teknisyen raporunu getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const rapor = await prisma.teknisyenRaporu.findUnique({
      where: { id },
      include: {
        dokumanlar: true,
      },
    });
    
    if (!rapor) {
      return NextResponse.json(
        { error: 'Teknisyen raporu bulunamadı' },
        { status: 404 }
      );
    }
    
    // Veritabanı modelini frontend modeline dönüştür
    const formattedRapor = {
      id: rapor.id,
      isinAdi: rapor.isinAdi,
      teknisyenNo: rapor.teknisyenNo,
      durum: rapor.durum,
      baslangicTarihi: rapor.baslangicTarihi.toISOString(),
      bitisTarihi: rapor.bitisTarihi ? rapor.bitisTarihi.toISOString() : null,
      olusturulmaTarihi: rapor.olusturulmaTarihi.toISOString(),
      guncellemeTarihi: rapor.guncellemeTarihi ? rapor.guncellemeTarihi.toISOString() : null,
      personeller: rapor.personeller,
      dokumanlar: rapor.dokumanlar.map((doc: any) => ({
        id: doc.id,
        dosyaAdi: doc.dosyaAdi,
        dosyaYolu: doc.dosyaYolu,
        dosyaBoyutu: doc.dosyaBoyutu,
        yuklemeTarihi: doc.yuklemeTarihi.toISOString(),
        raporId: doc.raporId
      })),
    };
    
    return NextResponse.json(formattedRapor);
  } catch (error) {
    console.error('Teknisyen raporu getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Teknisyen raporu getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Belirli bir teknisyen raporunu güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    // Gelen body'den doğru alan adlarını alalım
    const { isinAdi, teknisyenNo, durum, baslangicTarihi, bitisTarihi, personeller } = body;
    
    // Raporun mevcut olup olmadığını kontrol et
    const mevcutRapor = await prisma.teknisyenRaporu.findUnique({
      where: { id },
    });
    
    if (!mevcutRapor) {
      return NextResponse.json(
        { error: 'Güncellenecek teknisyen raporu bulunamadı' },
        { status: 404 }
      );
    }
    
    // Güncelleme verileri
    const updateData: any = {
      updatedAt: new Date(), // Güncellenme tarihi
    };
    
    // Doğru alan adlarını kullanarak updateData objesini doldur
    if (isinAdi !== undefined) updateData.isinAdi = isinAdi;
    if (teknisyenNo !== undefined) updateData.teknisyenNo = teknisyenNo;
    if (durum !== undefined) updateData.durum = durum;
    if (baslangicTarihi !== undefined) updateData.baslangicTarihi = new Date(baslangicTarihi);
    if (bitisTarihi !== undefined) updateData.bitisTarihi = bitisTarihi ? new Date(bitisTarihi) : null;
    if (personeller !== undefined) updateData.personeller = personeller;
    
    // Raporu güncelle
    const guncelRapor = await prisma.teknisyenRaporu.update({
      where: { id },
      data: updateData,
      include: {
        dokumanlar: true,
      },
    });
    
    // Güncel raporu frontend modeline dönüştür
    const formattedRapor = {
      id: guncelRapor.id,
      isinAdi: guncelRapor.isinAdi,
      teknisyenNo: guncelRapor.teknisyenNo,
      durum: guncelRapor.durum,
      baslangicTarihi: guncelRapor.baslangicTarihi.toISOString(),
      bitisTarihi: guncelRapor.bitisTarihi ? guncelRapor.bitisTarihi.toISOString() : null,
      olusturulmaTarihi: guncelRapor.olusturulmaTarihi.toISOString(),
      guncellemeTarihi: guncelRapor.guncellemeTarihi ? guncelRapor.guncellemeTarihi.toISOString() : null,
      personeller: guncelRapor.personeller,
      dokumanlar: guncelRapor.dokumanlar.map((doc: any) => ({
        id: doc.id,
        dosyaAdi: doc.dosyaAdi,
        dosyaYolu: doc.dosyaYolu,
        dosyaBoyutu: doc.dosyaBoyutu,
        yuklemeTarihi: doc.yuklemeTarihi.toISOString(),
        raporId: doc.raporId
      })),
    };
    
    return NextResponse.json(formattedRapor);
  } catch (error) {
    console.error('Teknisyen raporu güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Teknisyen raporu güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Belirli bir teknisyen raporunu sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Raporun mevcut olup olmadığını kontrol et
    const mevcutRapor = await prisma.teknisyenRaporu.findUnique({
      where: { id },
      include: { dokumanlar: true },
    });
    
    if (!mevcutRapor) {
      return NextResponse.json(
        { error: 'Silinecek teknisyen raporu bulunamadı' },
        { status: 404 }
      );
    }
    
    // Raporu sil (dokumanlarda cascade delete tanımlandığı için ilişkili dokümanlar da otomatik silinecek)
    await prisma.teknisyenRaporu.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Teknisyen raporu başarıyla silindi' });
  } catch (error) {
    console.error('Teknisyen raporu silinirken hata:', error);
    return NextResponse.json(
      { error: 'Teknisyen raporu silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 