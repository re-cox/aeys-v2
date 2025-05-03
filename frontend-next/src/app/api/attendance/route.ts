import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { Attendance, Prisma } from "@prisma/client";

// Debug için query loglama
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

// Debug için test fonksiyonu
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Tarih aralığına göre puantaj verilerini getir
export async function GET(request: NextRequest) {
  try {
    // Veritabanı bağlantısını test et
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      console.error('Veritabanı bağlantı hatası:', connectionTest.error);
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı', details: connectionTest.error },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    console.log('Puantaj verisi getiriliyor:', { startDate, endDate, userId });

    let whereConditions: Prisma.AttendanceWhereInput = {};

    if (startDate && endDate) {
      try {
        // String'leri Date nesnesine çevir
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Geçersiz tarih kontrolü (isteğe bağlı ama önerilir)
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return NextResponse.json({ error: 'Geçersiz tarih formatı', details: 'Tarihler YYYY-MM-DD formatında olmalıdır' }, { status: 400 });
        }
        
        //endDate yi gün sonuna ayarlama
        endDateObj.setHours(23, 59, 59, 999);

        whereConditions.date = {
          gte: startDateObj, // Date nesnesini kullan
          lte: endDateObj    // Date nesnesini kullan
        };
      } catch (dateError) {
        console.error("Tarih parse hatası:", dateError);
        return NextResponse.json({ error: 'Tarih formatı işlenirken hata oluştu', details: dateError instanceof Error ? dateError.message : String(dateError) }, { status: 400 });
      }
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereConditions,
      orderBy: {
        date: 'asc'
      }
    });

    console.log(`${attendanceRecords.length} puantaj kaydı bulundu`);
    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Puantaj verileri getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Puantaj verileri getirilemedi', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Puantaj kaydı oluştur veya güncelle
export async function POST(request: NextRequest) {
  try {
    // Veritabanı bağlantısını test et
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      console.error('Veritabanı bağlantı hatası:', connectionTest.error);
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı', details: connectionTest.error },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    
    console.log('Puantaj POST gelen veri:', JSON.stringify(data, null, 2));

    // Gerekli alanların kontrolü
    if (!data.userId || !data.date || !data.status) {
      console.error('POST /api/attendance - Eksik alanlar:', { 
        userId: data.userId,
        date: data.date, 
        status: data.status 
      });
      return NextResponse.json(
        { 
          error: "Gerekli alanlar eksik", 
          details: "userId, date ve status zorunlu alanlardır"
        },
        { status: 400 }
      );
    }

    // Tarihi doğru formatta kontrol et
    let dateString = data.date;
    if (typeof data.date === 'object' && data.date !== null && 'toISOString' in data.date) {
      dateString = (data.date as Date).toISOString().split('T')[0];
    }
    
    try {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Geçersiz tarih formatı");
      }
      
      // İsoString formatını alıp, T'den sonrasını at (sadece tarih kısmını al)
      const formattedDate = parsedDate.toISOString().split('T')[0];
      
      console.log("POST /api/attendance - Çözümlenen tarih:", formattedDate);
      
      try {
        // Önce mevcut kaydı kontrol et
        const existingRecord = await prisma.attendance.findFirst({
          where: {
            userId: data.userId,
            date: formattedDate,
          },
        });

        console.log("POST /api/attendance - Mevcut kayıt kontrolü:", 
          existingRecord ? "Kayıt mevcut" : "Kayıt yok");

        let savedRecord;

        // Kayıt varsa güncelle, yoksa yeni kayıt oluştur
        if (existingRecord) {
          try {
            const updateData: Prisma.AttendanceUpdateInput = {
              status: data.status,
              hasOvertime: data.hasOvertime || false,
              overtimeStart: data.overtimeStart || null,
              overtimeEnd: data.overtimeEnd || null,
              isHoliday: data.isHoliday || false,
              notes: data.notes || null
            };
            
            console.log("POST /api/attendance - Güncellenecek veri:", JSON.stringify(updateData, null, 2));
            
            savedRecord = await prisma.attendance.update({
              where: {
                id: existingRecord.id,
              },
              data: updateData,
            });
            console.log("POST /api/attendance - Kayıt güncellendi:", JSON.stringify(savedRecord, null, 2));
          } catch (updateError) {
            console.error("POST /api/attendance - Güncelleme hatası:", updateError);
            throw new Error(`Puantaj güncellenirken hata oluştu: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
          }
        } else {
          try {
            const createData: Prisma.AttendanceCreateInput = {
              user: { connect: { id: data.userId } },
              date: formattedDate, // string formatında tarih kullan
              status: data.status,
              hasOvertime: data.hasOvertime || false,
              overtimeStart: data.overtimeStart || null,
              overtimeEnd: data.overtimeEnd || null,
              isHoliday: data.isHoliday || false,
              notes: data.notes || null
            };
            
            console.log("POST /api/attendance - Oluşturulacak veri:", JSON.stringify(createData, null, 2));
            
            savedRecord = await prisma.attendance.create({
              data: createData,
            });
            console.log("POST /api/attendance - Yeni kayıt oluşturuldu:", JSON.stringify(savedRecord, null, 2));
          } catch (createError) {
            console.error("POST /api/attendance - Oluşturma hatası:", createError);
            throw new Error(`Puantaj oluşturulurken hata oluştu: ${createError instanceof Error ? createError.message : String(createError)}`);
          }
        }

        return NextResponse.json(savedRecord);
      } catch (dbError) {
        console.error("POST /api/attendance - Veritabanı hatası:", dbError);
        return NextResponse.json(
          { 
            error: "Veritabanı işlemi başarısız", 
            details: dbError instanceof Error ? dbError.message : String(dbError)
          },
          { status: 500 }
        );
      }
    } catch (dateError) {
      console.error("POST /api/attendance - Tarih çözümleme hatası:", dateError, data.date);
      return NextResponse.json(
        { 
          error: "Geçersiz tarih formatı", 
          details: "Tarih YYYY-MM-DD formatında olmalıdır" 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/attendance - Genel hata:", error);
    return NextResponse.json(
      { 
        error: "İşlem sırasında bir hata oluştu", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Puantaj kaydı silme
export async function DELETE(request: NextRequest) {
  try {
    // Veritabanı bağlantısını test et
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı', details: connectionTest.error },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // ID kontrolü
    if (!id) {
      return NextResponse.json(
        { error: 'Silme işlemi için ID parametresi gerekli' },
        { status: 400 }
      );
    }

    // Kaydı sil
    try {
      const result: Attendance = await prisma.attendance.delete({
        where: {
          id: id
        }
      });
      console.log('Attendance record deleted:', result);
      return NextResponse.json({ success: true, message: 'Puantaj kaydı silindi' });
    } catch (deleteError) {
      console.error('Kayıt silme hatası:', deleteError);
      return NextResponse.json(
        { 
          error: 'Puantaj kaydı silinemedi', 
          details: deleteError instanceof Error ? deleteError.message : String(deleteError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Puantaj kaydı silinirken hata:', error);
    return NextResponse.json(
      { error: 'Puantaj kaydı silinemedi', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 