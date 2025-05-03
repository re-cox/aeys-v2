import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';

// Veritabanı bağlantısını test et
export async function testDatabaseConnection() {
  try {
    console.log("[DATABASE] Veritabanı bağlantısı test ediliyor...");
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    console.log("[DATABASE] Veritabanı bağlantısı başarılı:", result);
    return { success: true, message: "Bağlantı başarılı" };
  } catch (error) {
    console.error("[DATABASE] Veritabanı bağlantı hatası:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: "Veritabanı bağlantısı kurulamadı", 
      error: errorMessage,
      details: error
    };
  }
}

// Tüm yıllık izinleri getir
export async function GET(request: NextRequest) {
  console.log("[API] Yıllık izin listesi istendi");

  // Veritabanı bağlantısı kontrolü
  try {
    const dbConnection = await testDatabaseConnection();
    if (!dbConnection.success) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor:", dbConnection.error);
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı.", 
        details: dbConnection.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // URL parametrelerini kontrol et
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    console.log(`[API] İzin sorgusu - Parametreler: employeeId=${employeeId || 'tümü'}`);

    // Eğer employeeId parametresi varsa, sadece o personelin izinlerini getir
    if (employeeId) {
      try {
        console.log(`[API] ${employeeId} ID'li personelin izinleri getiriliyor...`);
        const annualLeaves = await prisma.annualLeave.findMany({
          where: { employeeId },
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
          },
          orderBy: {
            startDate: 'desc'
          }
        });

        console.log(`[API] ${annualLeaves.length} izin kaydı başarıyla getirildi`);
        return NextResponse.json(annualLeaves);
      } catch (error) {
        console.error("[API] Personel izinleri getirme hatası:", error);
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        const errorStack = error instanceof Error ? error.stack : "";
        return NextResponse.json({ 
          error: "Personel izin kayıtları alınamadı", 
          details: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }

    // Tüm izinleri getir
    try {
      console.log("[API] Tüm izinler getiriliyor...");
      const annualLeaves = await prisma.annualLeave.findMany({
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
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      console.log(`[API] ${annualLeaves.length} izin kaydı başarıyla getirildi`);
      return NextResponse.json(annualLeaves);
    } catch (error) {
      console.error("[API] Tüm izinleri getirme hatası:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      const errorStack = error instanceof Error ? error.stack : "";
      return NextResponse.json({ 
        error: "İzin kayıtları alınamadı", 
        details: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] İzin listesi getirme hatası:", error);
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    const errorStack = error instanceof Error ? error.stack : "";
    return NextResponse.json({ 
      error: "İzin kayıtları alınamadı", 
      details: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Yeni yıllık izin oluştur
export async function POST(request: NextRequest) {
  console.log("[API] Yeni yıllık izin oluşturma isteği alındı");

  // Veritabanı bağlantısı kontrolü
  try {
    const dbConnection = await testDatabaseConnection();
    if (!dbConnection.success) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor:", dbConnection.error);
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı.", 
        details: dbConnection.error,
        timestamp: new Date().toISOString() 
      }, { status: 500 });
    }

    const leaveData = await request.json();

    // Zorunlu alanları kontrol et
    if (!leaveData.employeeId || !leaveData.startDate || !leaveData.endDate || !leaveData.daysTaken) {
      return NextResponse.json({
        error: "Personel ID, başlangıç tarihi, bitiş tarihi ve gün sayısı zorunlu alanlardır"
      }, { status: 400 });
    }

    try {
      // Personelin var olup olmadığını kontrol et
      const employee = await prisma.employee.findUnique({
        where: { id: leaveData.employeeId }
      });

      if (!employee) {
        return NextResponse.json({
          error: "Belirtilen personel bulunamadı"
        }, { status: 400 });
      }

      // Yeni izin oluştur
      const newLeave = await prisma.annualLeave.create({
        data: {
          employeeId: leaveData.employeeId,
          startDate: new Date(leaveData.startDate),
          endDate: new Date(leaveData.endDate),
          daysTaken: leaveData.daysTaken,
          status: leaveData.status || "PENDING",
          notes: leaveData.notes || null,
          approvedAt: leaveData.approvedAt ? new Date(leaveData.approvedAt) : null
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log("[API] Yeni yıllık izin başarıyla oluşturuldu:", newLeave.id);
      return NextResponse.json(newLeave, { status: 201 });
    } catch (error) {
      console.error("[API] Yıllık izin oluşturma hatası:", error);
      return NextResponse.json({ 
        error: "Yıllık izin oluşturulamadı", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Yıllık izin oluşturma hatası:", error);
    return NextResponse.json({ 
      error: "Yıllık izin oluşturulamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Yıllık izin sil
export async function DELETE(request: NextRequest) {
  console.log("[API] Yıllık izin silme isteği alındı");

  // Veritabanı bağlantısı kontrolü
  try {
    const dbConnection = await testDatabaseConnection();
    if (!dbConnection.success) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor:", dbConnection.error);
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı.", 
        details: dbConnection.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // URL'den id parametresini al 
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      console.error("[API] Silme isteğinde ID parametresi bulunamadı");
      return NextResponse.json({
        error: "Silme işlemi için yıllık izin ID'si gereklidir"
      }, { status: 400 });
    }

    console.log(`[API] Silinmek istenen yıllık izin ID'si: ${id}`);

    try {
      // İzin kaydının var olup olmadığını kontrol et
      const leave = await prisma.annualLeave.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              name: true
            }
          }
        }
      });

      if (!leave) {
        console.error(`[API] ${id} ID'li yıllık izin bulunamadı`);
        return NextResponse.json({
          error: "Silinmek istenen yıllık izin kaydı bulunamadı"
        }, { status: 404 });
      }

      console.log(`[API] ${id} ID'li yıllık izin siliniyor... (${leave.employee?.name})`);

      // İzni sil
      await prisma.annualLeave.delete({
        where: { id }
      });

      console.log(`[API] ${id} ID'li yıllık izin başarıyla silindi`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`[API] ${id} ID'li yıllık izin silinirken hata:`, error);
      return NextResponse.json({ 
        error: "Yıllık izin silinemedi", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Yıllık izin silme hatası:", error);
    return NextResponse.json({ 
      error: "Yıllık izin silinemedi", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
} 