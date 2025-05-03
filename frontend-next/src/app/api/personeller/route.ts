import { NextRequest, NextResponse } from "next/server";
import { Personel } from "@/types/teknisyen";

// In-memory veritabanı (geçici)
const personeller: Personel[] = [
  {
    id: "1",
    adSoyad: "Ahmet Yılmaz",
    telefon: "0532 111 22 33",
    email: "ahmet.yilmaz@ornek.com",
    departman: "Saha Operasyonları"
  },
  {
    id: "2",
    adSoyad: "Ayşe Demir",
    telefon: "0533 222 33 44",
    email: "ayse.demir@ornek.com",
    departman: "Teknik Destek"
  },
  {
    id: "3",
    adSoyad: "Mehmet Kaya",
    telefon: "0534 333 44 55",
    email: "mehmet.kaya@ornek.com",
    departman: "Saha Operasyonları"
  },
  {
    id: "4",
    adSoyad: "Zeynep Çelik",
    telefon: "0535 444 55 66",
    email: "zeynep.celik@ornek.com",
    departman: "Yönetim"
  },
  {
    id: "5",
    adSoyad: "Ali Yıldız",
    telefon: "0536 555 66 77",
    email: "ali.yildiz@ornek.com",
    departman: "Saha Operasyonları"
  }
];

// Tüm personelleri getir
export async function GET(request: NextRequest) {
  try {
    // URL'den departman parametresini al (isteğe bağlı)
    const { searchParams } = new URL(request.url);
    const departman = searchParams.get("departman");
    
    // Departman belirtilmişse filtrele
    let filteredPersoneller = personeller;
    if (departman) {
      filteredPersoneller = personeller.filter(
        (personel) => personel.departman === departman
      );
    }
    
    return NextResponse.json(filteredPersoneller);
  } catch (error) {
    console.error("Personeller getirilirken hata:", error);
    return NextResponse.json(
      { message: "Personeller getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 