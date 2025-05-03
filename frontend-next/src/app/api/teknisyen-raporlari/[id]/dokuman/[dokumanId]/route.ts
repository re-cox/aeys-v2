import { NextRequest, NextResponse } from "next/server";
import { TeknisyenDokuman } from "@/types/teknisyen";

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

// Dokümanı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dokumanId: string } }
) {
  try {
    const raporId = params.id;
    const dokumanId = params.dokumanId;
    
    // Önce dokümanın varlığını ve ilgili rapora ait olup olmadığını kontrol et
    const dokumanIndex = teknisyenDokumanlar.findIndex(
      (dokuman) => dokuman.id === dokumanId && dokuman.raporId === raporId
    );
    
    if (dokumanIndex === -1) {
      return NextResponse.json(
        { message: "Belirtilen döküman bulunamadı veya bu rapora ait değil" },
        { status: 404 }
      );
    }
    
    // Gerçek bir uygulamada, dosya sistemi işlemleri burada yapılır
    // Örneğin: dosya sisteminden dosyayı sil
    
    // Dokümanı diziden çıkar
    teknisyenDokumanlar.splice(dokumanIndex, 1);
    
    return NextResponse.json(
      { message: "Döküman başarıyla silindi" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Döküman (ID: ${params.dokumanId}) silinirken hata:`, error);
    return NextResponse.json(
      { message: "Döküman silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 