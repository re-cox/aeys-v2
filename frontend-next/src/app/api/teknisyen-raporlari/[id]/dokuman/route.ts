import { NextRequest, NextResponse } from "next/server";
import { TeknisyenDokuman } from "@/types/teknisyen";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// In-memory veritabanı (geçici)
// Gerçek bir uygulamada bu veriler veritabanında saklanır
let teknisyenDokumanlar: TeknisyenDokuman[] = [
  {
    id: "dok-1",
    dosyaAdi: "rapor-fotograf-1.jpg",
    dosyaUrl: "/uploads/teknisyen-raporlari/1/rapor-fotograf-1.jpg",
    dosyaYolu: "/uploads/teknisyen-raporlari/1/rapor-fotograf-1.jpg",
    dosyaTipu: "image/jpeg",
    dosyaBoyutu: 245000,
    createdAt: "2023-05-16T10:30:00Z",
    yuklemeTarihi: "2023-05-16T10:30:00Z",
    raporId: "1"
  },
  {
    id: "dok-2",
    dosyaAdi: "teknik-cizim.pdf",
    dosyaUrl: "/uploads/teknisyen-raporlari/1/teknik-cizim.pdf",
    dosyaYolu: "/uploads/teknisyen-raporlari/1/teknik-cizim.pdf",
    dosyaTipu: "application/pdf",
    dosyaBoyutu: 520000,
    createdAt: "2023-05-17T14:20:00Z",
    yuklemeTarihi: "2023-05-17T14:20:00Z",
    raporId: "1"
  },
  {
    id: "dok-3",
    dosyaAdi: "malzeme-listesi.xlsx",
    dosyaUrl: "/uploads/teknisyen-raporlari/2/malzeme-listesi.xlsx",
    dosyaYolu: "/uploads/teknisyen-raporlari/2/malzeme-listesi.xlsx",
    dosyaTipu: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dosyaBoyutu: 125000,
    createdAt: "2023-06-06T09:45:00Z",
    yuklemeTarihi: "2023-06-06T09:45:00Z",
    raporId: "2"
  },
  {
    id: "dok-4",
    dosyaAdi: "ariza-raporu.pdf",
    dosyaUrl: "/uploads/teknisyen-raporlari/3/ariza-raporu.pdf",
    dosyaYolu: "/uploads/teknisyen-raporlari/3/ariza-raporu.pdf",
    dosyaTipu: "application/pdf",
    dosyaBoyutu: 350000,
    createdAt: "2023-04-12T16:30:00Z",
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
    const aciklama = formData.get("aciklama") as string || "";
    const yuklayanId = formData.get("yuklayanId") as string || undefined;
    
    if (!dosya) {
      return NextResponse.json(
        { message: "Bir dosya gönderilmedi" },
        { status: 400 }
      );
    }
    
    console.log(`[TEKNISYEN DOKUMAN] Dosya alındı: ${dosya.name}, ${dosya.size} bytes, ${dosya.type}`);
    console.log(`[TEKNISYEN DOKUMAN] Rapor ID: ${raporId}, Açıklama: ${aciklama}, Yükleyen: ${yuklayanId || 'Belirtilmemiş'}`);
    
    // Dosyayı ArrayBuffer'a çevir
    const bytes = await dosya.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adını temizle ve benzersiz yap
    const cleanFileName = dosya.name.replace(/\s+/g, '-');
    const uniqueFileName = `${Date.now()}-${randomUUID().substring(0, 8)}-${cleanFileName}`;
    
    // Dosya kayıt yolları
    const raporKlasoru = `teknisyen-raporlari/${raporId}`;
    const publicBasePath = path.join(process.cwd(), 'public/uploads');
    const raporKlasoruPath = path.join(publicBasePath, raporKlasoru);
    const dosyaPath = path.join(raporKlasoruPath, uniqueFileName);
    
    try {
      // Klasörlerin var olduğundan emin ol
      if (!existsSync(publicBasePath)) {
        await mkdir(publicBasePath, { recursive: true });
        console.log(`[TEKNISYEN DOKUMAN] Ana uploads klasörü oluşturuldu: ${publicBasePath}`);
      }
      
      if (!existsSync(raporKlasoruPath)) {
        await mkdir(raporKlasoruPath, { recursive: true });
        console.log(`[TEKNISYEN DOKUMAN] Rapor klasörü oluşturuldu: ${raporKlasoruPath}`);
      }
      
      // Dosyayı kaydet
      await writeFile(dosyaPath, buffer);
      console.log(`[TEKNISYEN DOKUMAN] Dosya disk üzerine kaydedildi: ${dosyaPath}`);
      
      // URL yolunu public path olarak ayarla
      const publicUrl = `/uploads/${raporKlasoru}/${uniqueFileName}`;
      
      // Şimdiki zaman
      const suAn = new Date().toISOString();
      
      // Yeni doküman oluştur
      const yeniDokuman: TeknisyenDokuman = {
        id: randomUUID(),
        dosyaAdi: dosya.name,
        dosyaUrl: publicUrl,
        dosyaYolu: publicUrl,
        dosyaTipu: dosya.type || 'application/octet-stream',
        dosyaBoyutu: dosya.size,
        createdAt: suAn,
        yuklemeTarihi: suAn,
        raporId: raporId
      };
      
      // Dokümanı listeye ekle
      teknisyenDokumanlar.push(yeniDokuman);
      
      console.log(`[TEKNISYEN DOKUMAN] Yeni doküman kaydı oluşturuldu: ${yeniDokuman.id}`);
      return NextResponse.json(yeniDokuman, { status: 201 });
      
    } catch (fileError) {
      console.error('[TEKNISYEN DOKUMAN] Dosya yazma hatası:', fileError);
      return NextResponse.json(
        { message: "Dosya kaydedilirken bir hata oluştu", error: fileError instanceof Error ? fileError.message : "Bilinmeyen hata" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error(`[TEKNISYEN DOKUMAN] Doküman yüklenirken (Rapor ID: ${params.id}) hata:`, error);
    return NextResponse.json(
      { message: "Doküman yüklenirken bir hata oluştu", error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
} 