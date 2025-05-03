import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testDatabaseConnection } from '@/lib/prisma';

// GET - Tüm teknisyen raporlarını getir
export async function GET(req: NextRequest) {
  try {
    // Veritabanı bağlantısını test et
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Veritabanı bağlantısı başarısız oldu');
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı başarısız oldu' },
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const teknisyenId = searchParams.get('teknisyenId');
    const durum = searchParams.get('durum');
    
    // Filtreleme kriterleri oluştur
    const where: any = {};
    if (teknisyenId) where.teknisyenNo = teknisyenId;
    if (durum) where.durum = durum;
    
    console.log('TeknisyenRaporu tablosundan veri çekiliyor...');
    console.log('Filtreleme kriterleri:', where);
    
    try {
      // Prisma ORM kullanarak verileri çek (daha güvenli ve typesafe)
      const raporlar = await prisma.teknisyenRaporu.findMany({
        where,
        include: {
          dokumanlar: true, // İlişkili dokümanları getir
        },
        orderBy: {
          olusturulmaTarihi: 'desc',
        },
      });
      
      console.log(`${raporlar.length} adet rapor bulundu`);
      
      // Verileri frontend modeline dönüştür
      const formattedRaporlar = raporlar.map((report: any) => ({
        id: report.id,
        isinAdi: report.isinAdi,
        teknisyenNo: report.teknisyenNo,
        durum: report.durum,
        baslangicTarihi: report.baslangicTarihi.toISOString(),
        bitisTarihi: report.bitisTarihi ? report.bitisTarihi.toISOString() : null,
        olusturulmaTarihi: report.olusturulmaTarihi.toISOString(),
        guncellemeTarihi: report.guncellemeTarihi ? report.guncellemeTarihi.toISOString() : null,
        personeller: report.personeller || [], // Null kontrolü
        dokumanlar: report.dokumanlar.map((doc: any) => ({
          id: doc.id,
          dosyaAdi: doc.dosyaAdi,
          dosyaYolu: doc.dosyaYolu,
          dosyaBoyutu: doc.dosyaBoyutu,
          yuklemeTarihi: doc.yuklemeTarihi.toISOString(),
          raporId: doc.raporId
        })),
      }));
      
      return NextResponse.json(formattedRaporlar);
    } catch (prismaError) {
      console.error('Prisma sorgusu çalıştırılırken hata:', prismaError);
      
      // Daha detaylı hata bilgisi
      if (prismaError instanceof Error) {
        console.error('Hata tipi:', prismaError.name);
        console.error('Hata mesajı:', prismaError.message);
        console.error('Hata stack:', prismaError.stack);
      }
      
      return NextResponse.json(
        { error: 'Teknisyen raporları getirilirken bir veritabanı hatası oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Teknisyen raporları getirilirken hata:', error);
    
    // Error detaylarını logla
    if (error instanceof Error) {
      console.error('Hata tipi:', error.name);
      console.error('Hata mesajı:', error.message);
      console.error('Hata stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Teknisyen raporları alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni teknisyen raporu oluştur
export async function POST(req: NextRequest) {
  try {
    // Veritabanı bağlantısını test et
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Veritabanı bağlantısı başarısız oldu');
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı başarısız oldu' },
        { status: 500 }
      );
    }
  
    const body = await req.json();
    const { isinAdi, teknisyenNo, durum, baslangicTarihi, bitisTarihi, personeller } = body;
    
    if (!isinAdi || !teknisyenNo) {
      return NextResponse.json(
        { error: 'İşin Adı ve Teknisyen No zorunludur' },
        { status: 400 }
      );
    }
    
    console.log('Yeni teknisyen raporu oluşturuluyor:', {
      isinAdi,
      teknisyenNo,
      durum,
      baslangicTarihi,
      bitisTarihi,
      personeller
    });
    
    try {
      // Prisma create metodunu kullanarak yeni rapor oluştur
      const yeniRapor = await prisma.teknisyenRaporu.create({
        data: {
          isinAdi: isinAdi,
          teknisyenNo: teknisyenNo,
          durum: durum || 'Beklemede',
          baslangicTarihi: new Date(baslangicTarihi),
          bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
          personeller: personeller || [],
        },
        include: {
          dokumanlar: true,
        },
      });
      
      console.log('Yeni rapor oluşturuldu, ID:', yeniRapor.id);
      
      // Oluşturulan raporu frontend modeline dönüştür (GET ile aynı formatı kullanalım)
      const formattedRapor = {
        id: yeniRapor.id,
        isinAdi: yeniRapor.isinAdi,
        teknisyenNo: yeniRapor.teknisyenNo,
        durum: yeniRapor.durum,
        baslangicTarihi: yeniRapor.baslangicTarihi.toISOString(),
        bitisTarihi: yeniRapor.bitisTarihi ? yeniRapor.bitisTarihi.toISOString() : null,
        olusturulmaTarihi: yeniRapor.olusturulmaTarihi.toISOString(),
        guncellemeTarihi: yeniRapor.guncellemeTarihi ? yeniRapor.guncellemeTarihi.toISOString() : null,
        personeller: yeniRapor.personeller || [],
        dokumanlar: yeniRapor.dokumanlar.map((doc: any) => ({
          id: doc.id,
          dosyaAdi: doc.dosyaAdi,
          dosyaYolu: doc.dosyaYolu,
          dosyaBoyutu: doc.dosyaBoyutu,
          yuklemeTarihi: doc.yuklemeTarihi.toISOString(),
          raporId: doc.raporId
        })),
      };
      
      return NextResponse.json(formattedRapor, { status: 201 });
    } catch (prismaError) {
      console.error('Prisma ile rapor oluşturulurken hata:', prismaError);
      
      // Daha detaylı hata bilgisi
      if (prismaError instanceof Error) {
        console.error('Hata tipi:', prismaError.name);
        console.error('Hata mesajı:', prismaError.message);
        console.error('Hata stack:', prismaError.stack);
      }
      
      return NextResponse.json(
        { error: 'Teknisyen raporu oluşturulurken bir veritabanı hatası oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Teknisyen raporu oluşturulurken genel hata:', error);
    
    // Error detaylarını logla
    if (error instanceof Error) {
      console.error('Hata tipi:', error.name);
      console.error('Hata mesajı:', error.message);
      console.error('Hata stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Teknisyen raporu oluşturulurken bir sunucu hatası oluştu' },
      { status: 500 }
    );
  }
} 