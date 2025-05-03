import { NextRequest, NextResponse } from "next/server";
import { TeknisyenRaporu, TeknisyenRaporuDurum } from "@/types/teknisyen";
import { randomUUID } from "crypto";

// In-memory veritabanı (geçici)
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

// Tüm teknisyen raporlarını getir
export async function GET(request: NextRequest) {
  try {
    // URL'den durum parametresini al (isteğe bağlı)
    const { searchParams } = new URL(request.url);
    const durum = searchParams.get("durum") as TeknisyenRaporuDurum | null;
    
    // Durum belirtilmişse filtrele
    let filteredRaporlar = teknisyenRaporlari;
    if (durum) {
      filteredRaporlar = teknisyenRaporlari.filter(
        (rapor) => rapor.durum === durum
      );
    }
    
    return NextResponse.json(filteredRaporlar);
  } catch (error) {
    console.error("Teknisyen raporları getirilirken hata:", error);
    return NextResponse.json(
      { message: "Teknisyen raporları getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yeni teknisyen raporu oluştur
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Gerekli alanları kontrol et
    if (!data.isinAdi || !data.teknisyenNo) {
      return NextResponse.json(
        { message: "İşin adı ve teknisyen numarası zorunludur" },
        { status: 400 }
      );
    }
    
    // Yeni rapor oluştur
    const yeniRapor: TeknisyenRaporu = {
      id: randomUUID(),
      isinAdi: data.isinAdi,
      teknisyenNo: data.teknisyenNo,
      durum: data.durum || "Beklemede",
      baslangicTarihi: data.baslangicTarihi || new Date().toISOString(),
      bitisTarihi: data.bitisTarihi,
      olusturulmaTarihi: new Date().toISOString(),
      personeller: data.personeller || [],
      dokumanlar: [],
    };
    
    // Raporu ekle
    teknisyenRaporlari.push(yeniRapor);
    
    return NextResponse.json(yeniRapor, { status: 201 });
  } catch (error) {
    console.error("Teknisyen raporu oluşturulurken hata:", error);
    return NextResponse.json(
      { message: "Teknisyen raporu oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
} 