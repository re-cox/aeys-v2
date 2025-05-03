import { NextRequest, NextResponse } from "next/server";
import { TeknisyenDokuman } from "@/types/teknisyen";
import { randomUUID } from "crypto";

// In-memory veritabanı (geçici)
// Gerçek bir uygulamada bu veriler veritabanında saklanır
let teknisyenDokumanlar: TeknisyenDokuman[] = [
  {
    id: "dok-1",
    dosyaAdi: "rapor-fotograf-1.jpg",
    dosyaYolu: "/uploads/teknisyen-raporlari/1/rapor-fotograf-1.jpg",
    dosyaBoyutu: 245000,
    yuklemeTarihi: "2023-05-16T10:30:00Z",
    raporId: "1"
  },
  {
    id: "dok-2",
    dosyaAdi: "teknik-cizim.pdf",
    dosyaYolu: "/uploads/teknisyen-raporlari/1/teknik-cizim.pdf",
    dosyaBoyutu: 520000,
    yuklemeTarihi: "2023-05-17T14:20:00Z",
    raporId: "1"
  },
  {
    id: "dok-3",
    dosyaAdi: "malzeme-listesi.xlsx",
    dosyaYolu: "/uploads/teknisyen-raporlari/2/malzeme-listesi.xlsx",
    dosyaBoyutu: 125000,
    yuklemeTarihi: "2023-06-06T09:45:00Z",
    raporId: "2"
  },
  {
    id: "dok-4",
    dosyaAdi: "ariza-raporu.pdf",
    dosyaYolu: "/uploads/teknisyen-raporlari/3/ariza-raporu.pdf",
    dosyaBoyutu: 350000,
    yuklemeTarihi: "2023-04-12T16:30:00Z",
    raporId: "3"
  }
];

// Belirli bir rapora ait tüm dokümanları getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raporId = params.id;
    
    // Belirli bir rapora ait dokümanları filtrele
    const raporDokumanlari = teknisyenDokumanlar.filter(
      (dokuman) => dokuman.raporId === raporId
    );
    
    return NextResponse.json(raporDokumanlari);
  } catch (error) {
    console.error(`Rapor dokümanları (Rapor ID: ${params.id}) getirilirken hata:`, error);
    return NextResponse.json(
      { message: "Rapor dokümanları getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yeni doküman ekle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raporId = params.id;
    const formData = await request.formData();
    const dosya = formData.get("file") as File;
    
    if (!dosya) {
      return NextResponse.json(
        { message: "Bir dosya gönderilmedi" },
        { status: 400 }
      );
    }
    
    // Gerçek uygulamada dosya burada kaydedilir
    
    // Yeni doküman oluştur
    const yeniDokuman: TeknisyenDokuman = {
      id: randomUUID(),
      dosyaAdi: dosya.name,
      dosyaYolu: `/uploads/teknisyen-raporlari/${raporId}/${dosya.name}`,
      dosyaBoyutu: dosya.size,
      yuklemeTarihi: new Date().toISOString(),
      raporId: raporId
    };
    
    // Dokümanı ekle
    teknisyenDokumanlar.push(yeniDokuman);
    
    return NextResponse.json(yeniDokuman, { status: 201 });
  } catch (error) {
    console.error(`Doküman yüklenirken (Rapor ID: ${params.id}) hata:`, error);
    return NextResponse.json(
      { message: "Doküman yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 