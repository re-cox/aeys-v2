import { NextRequest, NextResponse } from "next/server";
import prisma, { testDatabaseConnection } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Departman listesini getir
export async function GET(request: NextRequest) {
  console.log("[API] Departman listesi istendi");
  
  // Veritabanı bağlantı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı. Lütfen veritabanı ayarlarınızı kontrol edin.",
        message: "Veritabanı bağlantı hatası" 
      }, { status: 500 });
    }

    // URL'den id parametresini al
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const idParam = segments[segments.length - 1];

    // Belirli bir departman için istek
    if (idParam && idParam !== "departments") {
      try {
        console.log(`[API] Departman ${idParam} sorgulanıyor...`);
        const department = await prisma.department.findUnique({
          where: { id: idParam },
          include: {
            employees: {
              select: {
                id: true,
                position: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        if (!department) {
          console.log(`[API] Departman bulunamadı: ${idParam}`);
          return NextResponse.json({ error: "Departman bulunamadı" }, { status: 404 });
        }

        console.log(`[API] Departman ${idParam} başarıyla getirildi`);
        return NextResponse.json(department);
      } catch (findError) {
        console.error(`[API] Departman ${idParam} getirme hatası:`, findError);
        return NextResponse.json({ 
          error: "Departman getirilirken bir hata oluştu",
          message: "Veritabanı işlem hatası",
          details: findError instanceof Error ? findError.message : "Bilinmeyen hata"
        }, { status: 500 });
      }
    }

    // Tüm departmanları getir
    try {
      console.log("[API] Tüm departmanlar getiriliyor...");
      const departments = await prisma.department.findMany({
        orderBy: {
          name: 'asc'
        }
      });

      console.log(`[API] ${departments.length} departman başarıyla getirildi`);
      
      return NextResponse.json({ success: true, data: departments });

    } catch (findManyError) {
      console.error("[API] Tüm departmanları getirme hatası:", findManyError);
      return NextResponse.json({ 
        error: "Departmanlar alınamadı",
        message: "Veritabanı işlem hatası",
        details: findManyError instanceof Error ? findManyError.message : "Bilinmeyen hata"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Departman listesi getirme hatası:", error);
    return NextResponse.json({ 
      error: "Departmanlar alınamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Yeni departman oluştur
export async function POST(request: NextRequest) {
  console.log("[API] Yeni departman oluşturma isteği alındı");
  
  // Veritabanı bağlantı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanı bağlantısı kurulamadı. Lütfen veritabanı ayarlarınızı kontrol edin.",
        message: "Veritabanı bağlantı hatası" 
      }, { status: 500 });
    }

    const departmentData = await request.json();

    // Departman adı kontrolü
    if (!departmentData.name) {
      return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 });
    }
    
    try {
      console.log("[API] Yeni departman oluşturuluyor:", departmentData.name);
      const newDepartment = await prisma.department.create({
        data: {
          name: departmentData.name,
          description: departmentData.description || null
        }
      });

      console.log("[API] Yeni departman başarıyla oluşturuldu:", newDepartment.id);
      return NextResponse.json(newDepartment, { status: 201 });
    } catch (createError) {
      console.error("[API] Departman oluşturma hatası:", createError);
      return NextResponse.json({ 
        error: "Departman oluşturulamadı",
        message: "Veritabanı işlem hatası",
        details: createError instanceof Error ? createError.message : "Bilinmeyen hata"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Departman oluşturma hatası:", error);
    return NextResponse.json({ 
      error: "Departman oluşturulamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Departman güncelle
export async function PUT(request: NextRequest) {
  console.log("[API] Departman güncelleme isteği alındı");
  
  // Veritabanı bağlantı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanı bağlantısı kurulamadı. Lütfen veritabanı ayarlarınızı kontrol edin.",
        message: "Veritabanı bağlantı hatası" 
      }, { status: 500 });
    }

    // İsteği klonla (birden fazla kullanım için)
    const requestClone = request.clone();
    
    // İstek gövdesini bir kez oku
    let departmentData;
    try {
      departmentData = await request.json();
      console.log("[API] Departman güncelleme ham verileri:", JSON.stringify(departmentData));
    } catch (parseError) {
      console.error("[API] İstek gövdesi JSON olarak ayrıştırılamadı:", parseError);
      return NextResponse.json({ 
        error: "Geçersiz istek gövdesi. JSON formatı bekleniyor.",
        details: parseError instanceof Error ? parseError.message : "Bilinmeyen hata"
      }, { status: 400 });
    }
    
    // URL'den id parametresini al
    const url = new URL(requestClone.url);
    const segments = url.pathname.split('/');
    let idParam = segments[segments.length - 1];
    
    // Eğer departmanlar kısmıysa, request gövdesinden ID'yi alıyoruz
    if (idParam === "departments") {
      if (!departmentData.id) {
        console.error("[API] Departman ID'si eksik");
        return NextResponse.json({ error: "Departman ID'si zorunludur" }, { status: 400 });
      }
      idParam = departmentData.id;
    }
    
    console.log("[API] Güncellenecek departman ID'si:", idParam);
    
    // ID'nin geçerli olduğundan emin ol
    if (!idParam) {
      console.error("[API] Departman ID'si belirtilmemiş");
      return NextResponse.json({ error: "Departman ID'si zorunludur" }, { status: 400 });
    }

    try {
      // Departmanın var olup olmadığını kontrol et
      console.log("[API] Departman varlığı kontrol ediliyor. ID:", idParam);
      const existingDepartment = await prisma.department.findUnique({
        where: { id: idParam }
      });

      if (!existingDepartment) {
        console.log("[API] Güncellenecek departman bulunamadı:", idParam);
        return NextResponse.json({ error: "Güncellenecek departman bulunamadı" }, { status: 404 });
      }

      console.log("[API] Mevcut departman bulundu:", JSON.stringify(existingDepartment));

      // Zorunlu alanları doğrula
      if (!departmentData.name || departmentData.name.trim() === '') {
        console.error("[API] Departman adı boş olamaz");
        return NextResponse.json({ error: "Departman adı zorunludur" }, { status: 400 });
      }

      // Prisma şemasına uygun veri hazırla
      // Sadece şemada tanımlı alanları kullan
      const updateData = {
        name: departmentData.name.trim(),
        description: departmentData.description !== undefined ? departmentData.description.trim() : undefined
      };
      
      console.log("[API] Departman güncelleme verileri (temizlenmiş):", JSON.stringify(updateData));
      
      try {
        // Departmanı güncelle
        const updatedDepartment = await prisma.department.update({
          where: { id: idParam },
          data: updateData
        });

        console.log("[API] Departman başarıyla güncellendi:", JSON.stringify(updatedDepartment));
        return NextResponse.json(updatedDepartment);
      } catch (dbError: any) {
        console.error("[API] Veritabanı güncelleme hatası:", dbError);
        console.error("[API] Hata detayları:", JSON.stringify(dbError));
        
        // Unique constraint hatası kontrolü
        if (dbError instanceof PrismaClientKnownRequestError && dbError.code === 'P2002') {
          return NextResponse.json({ 
            error: "Bu departman adı zaten kullanılıyor.",
            message: "Lütfen farklı bir departman adı seçin" 
          }, { status: 409 });
        }
        
        return NextResponse.json({ 
          error: "Departman güncellenirken veritabanı hatası oluştu",
          message: "Veritabanı güncelleme hatası",
          details: dbError instanceof Error ? dbError.message : "Bilinmeyen hata"
        }, { status: 500 });
      }
    } catch (updateError) {
      console.error("[API] Departman güncelleme hatası (detaylı):", updateError);
      return NextResponse.json({ 
        error: "Departman güncellenemedi",
        message: "Veritabanı işlem hatası",
        details: updateError instanceof Error ? updateError.message : "Bilinmeyen hata"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Departman güncelleme hatası:", error);
    return NextResponse.json({ 
      error: "Departman güncellenemedi", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Departman sil
export async function DELETE(request: NextRequest) {
  console.log("[API] Departman silme isteği alındı");
  
  // Veritabanı bağlantı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanı bağlantısı kurulamadı.",
        message: "Veritabanı bağlantı hatası" 
      }, { status: 500 });
    }

    // URL'den id parametresini al
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const idParam = segments[segments.length - 1];

    if (!idParam || idParam === "departments") {
      console.error("[API] Silinecek departman ID'si belirtilmemiş");
      return NextResponse.json({ error: "Silinecek departman ID'si URL'de belirtilmelidir" }, { status: 400 });
    }

    console.log(`[API] Departman ${idParam} silinecek...`);

    try {
      await prisma.department.delete({
        where: { id: idParam },
      });

      console.log(`[API] Departman ${idParam} başarıyla silindi`);
      return new NextResponse(null, { status: 204 }); // Başarılı silme
    } catch (error: any) { // Use 'any' type for the caught error
      console.error(`[API] Departman ${idParam} silme hatası:`, error);
      
      // Kayıt bulunamadı hatası
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') { // Check if it's the correct error type
        console.log(`[API] Silinecek departman bulunamadı: ${idParam}`);
        return NextResponse.json({ error: "Silinecek departman bulunamadı" }, { status: 404 });
      }
      
      // İlişkili kayıtlar var hatası (eğer silme kaskad değilse)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        console.log(`[API] Departmana bağlı çalışanlar var, silinemiyor: ${idParam}`);
        return NextResponse.json({ 
          error: "Departmana bağlı çalışanlar bulunduğu için silinemez.",
          message: "Önce departmana bağlı tüm çalışanları başka bir departmana taşıyın veya silin."
        }, { status: 409 }); // Conflict
      }
      
      return NextResponse.json({ 
        error: "Departman silinemedi",
        message: "Veritabanı işlem hatası",
        details: error instanceof Error ? error.message : "Bilinmeyen hata"
      }, { status: 500 });
    }
  } catch (error: any) { // Use 'any' for outer catch as well
    console.error("[API] Departman silme genel hatası:", error);
    return NextResponse.json({ 
      error: "Departman silme işlemi sırasında genel bir hata oluştu", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
} 