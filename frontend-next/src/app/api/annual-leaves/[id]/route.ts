import { NextRequest, NextResponse } from "next/server";
import { prisma, testDatabaseConnection } from "../../employees/route";

// Belirli bir yıllık izni getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log(`[API] ID: ${id} olan yıllık izin detayı istendi`);

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı. Lütfen veritabanı ayarlarınızı kontrol edin.",
        message: "Veritabanı bağlantı hatası"
      }, { status: 500 });
    }

    // ID'yi kontrol et
    if (!id) {
      console.error("[API] Yıllık izin ID'si belirtilmemiş");
      return NextResponse.json({ error: "Yıllık izin ID'si zorunludur" }, { status: 400 });
    }

    try {
      // Yıllık izni getir
      console.log(`[API] ID: ${id} olan yıllık izin verileri getiriliyor...`);
      const annualLeave = await prisma.annualLeave.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surname: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!annualLeave) {
        console.log(`[API] ID: ${id} olan yıllık izin bulunamadı`);
        return NextResponse.json({ error: "Yıllık izin bulunamadı" }, { status: 404 });
      }

      console.log(`[API] ID: ${id} olan yıllık izin başarıyla getirildi`);
      return NextResponse.json(annualLeave);
    } catch (error) {
      console.error(`[API] ID: ${id} olan yıllık izin getirilirken hata:`, error);
      return NextResponse.json({ 
        error: "Yıllık izin bilgileri alınamadı", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`[API] ID: ${id} olan yıllık izin getirilirken hata:`, error);
    return NextResponse.json({ 
      error: "Yıllık izin bilgileri alınamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Belirli bir yıllık izni güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log(`[API] ID: ${id} olan yıllık izin güncelleme isteği alındı`);

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı. Lütfen veritabanı ayarlarınızı kontrol edin.",
        message: "Veritabanı bağlantı hatası"
      }, { status: 500 });
    }

    // ID'yi kontrol et
    if (!id) {
      console.error("[API] Yıllık izin ID'si belirtilmemiş");
      return NextResponse.json({ error: "Yıllık izin ID'si zorunludur" }, { status: 400 });
    }

    // Güncelleme verilerini al
    const updateData = await request.json();
    console.log(`[API] ID: ${id} için güncelleme verileri:`, updateData);

    try {
      // Yıllık iznin var olup olmadığını kontrol et
      const existingLeave = await prisma.annualLeave.findUnique({
        where: { id }
      });

      if (!existingLeave) {
        console.log(`[API] ID: ${id} olan yıllık izin bulunamadı`);
        return NextResponse.json({ error: "Yıllık izin bulunamadı" }, { status: 404 });
      }

      // Yıllık izni güncelle
      console.log(`[API] ID: ${id} olan yıllık izin güncelleniyor...`);
      const updatedLeave = await prisma.annualLeave.update({
        where: { id },
        data: {
          employeeId: updateData.employeeId,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
          daysTaken: updateData.daysTaken,
          status: updateData.status || existingLeave.status,
          approvedAt: updateData.approvedAt ? new Date(updateData.approvedAt) : undefined,
          notes: updateData.notes || null
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      console.log(`[API] ID: ${id} olan yıllık izin başarıyla güncellendi`);
      return NextResponse.json(updatedLeave);
    } catch (error) {
      console.error(`[API] ID: ${id} olan yıllık izin güncellenirken hata:`, error);
      return NextResponse.json({ 
        error: "Yıllık izin güncellenemedi", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`[API] ID: ${id} olan yıllık izin güncellenirken hata:`, error);
    return NextResponse.json({ 
      error: "Yıllık izin güncellenemedi", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
} 