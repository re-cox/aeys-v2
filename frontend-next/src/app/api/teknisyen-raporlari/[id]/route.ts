import { NextRequest, NextResponse } from "next/server";
import { TeknisyenRaporu } from "@/types/teknisyen";

// Varsayalım ki ana route.ts dosyasından verilere erişim sağlanabilir.
// Not: Gerçekte bir veritabanı kullanılmalıdır.
// Bu dosya için mockup data kullanıyoruz
let teknisyenRaporlari: TeknisyenRaporu[] = [
  {
    id: "1",
    isinAdi: "Trafo Bakımı",
    teknisyenNo: "TKN-001",
    durum: "Beklemede",
    baslangicTarihi: "2023-05-15T08:30:00Z",
    bitisTarihi: undefined,
    olusturulmaTarihi: "2023-05-14T14:20:00Z",
    personeller: ["1", "3"],
    dokumanlar: [],
  },
  {
    id: "2",
    isinAdi: "Hat Kontrolü",
    teknisyenNo: "TKN-002",
    durum: "Fiyatlar Girildi",
    baslangicTarihi: "2023-06-05T09:15:00Z",
    bitisTarihi: undefined,
    olusturulmaTarihi: "2023-06-04T16:45:00Z",
    personeller: ["2"],
    dokumanlar: [],
  },
  {
    id: "3",
    isinAdi: "Arıza Giderme",
    teknisyenNo: "TKN-003",
    durum: "Fatura Kesildi",
    baslangicTarihi: "2023-04-10T10:00:00Z",
    bitisTarihi: "2023-04-15T17:30:00Z",
    olusturulmaTarihi: "2023-04-09T11:20:00Z",
    guncellemeTarihi: "2023-04-15T17:45:00Z",
    personeller: ["1", "5"],
    dokumanlar: [],
  },
  {
    id: "4",
    isinAdi: "Bağlantı Kurulumu",
    teknisyenNo: "TKN-004",
    durum: "İptal Edildi",
    baslangicTarihi: "2023-07-20T08:00:00Z",
    bitisTarihi: undefined,
    olusturulmaTarihi: "2023-07-19T14:10:00Z",
    guncellemeTarihi: "2023-07-21T09:30:00Z",
    personeller: [],
    dokumanlar: [],
  },
  {
    id: "5",
    isinAdi: "Pano Değişimi",
    teknisyenNo: "TKN-005",
    durum: "Beklemede",
    baslangicTarihi: "2023-08-01T13:45:00Z",
    bitisTarihi: undefined,
    olusturulmaTarihi: "2023-07-31T15:30:00Z",
    personeller: ["4"],
    dokumanlar: [],
  },
];

// Belirli bir teknisyen raporunu getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const rapor = teknisyenRaporlari.find((r) => r.id === id);

    if (!rapor) {
      return NextResponse.json(
        { message: "Teknisyen raporu bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(rapor);
  } catch (error) {
    console.error(`Teknisyen raporu (ID: ${params.id}) getirilirken hata:`, error);
    return NextResponse.json(
      { message: "Teknisyen raporu getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Teknisyen raporunu güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const raporIndex = teknisyenRaporlari.findIndex((r) => r.id === id);

    if (raporIndex === -1) {
      return NextResponse.json(
        { message: "Teknisyen raporu bulunamadı" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const guncellenecekRapor = teknisyenRaporlari[raporIndex];

    // Raporu güncelle
    const guncelRapor: TeknisyenRaporu = {
      ...guncellenecekRapor,
      isinAdi: data.isinAdi || guncellenecekRapor.isinAdi,
      teknisyenNo: data.teknisyenNo || guncellenecekRapor.teknisyenNo,
      durum: data.durum || guncellenecekRapor.durum,
      baslangicTarihi: data.baslangicTarihi || guncellenecekRapor.baslangicTarihi,
      bitisTarihi: data.bitisTarihi || guncellenecekRapor.bitisTarihi,
      guncellemeTarihi: new Date().toISOString(),
      personeller: data.personeller || guncellenecekRapor.personeller,
    };

    teknisyenRaporlari[raporIndex] = guncelRapor;

    return NextResponse.json(guncelRapor);
  } catch (error) {
    console.error(`Teknisyen raporu (ID: ${params.id}) güncellenirken hata:`, error);
    return NextResponse.json(
      { message: "Teknisyen raporu güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Teknisyen raporunu sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const raporIndex = teknisyenRaporlari.findIndex((r) => r.id === id);

    if (raporIndex === -1) {
      return NextResponse.json(
        { message: "Teknisyen raporu bulunamadı" },
        { status: 404 }
      );
    }

    // Raporu sil
    teknisyenRaporlari.splice(raporIndex, 1);

    return NextResponse.json(
      { message: "Teknisyen raporu başarıyla silindi" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Teknisyen raporu (ID: ${params.id}) silinirken hata:`, error);
    return NextResponse.json(
      { message: "Teknisyen raporu silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 