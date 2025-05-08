import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma

export async function GET(request: Request) {
  try {
    console.log('[API Projects GET] Fetching projects...');
    
    // Veritabanı bağlantısı kontrolü
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
    } catch (dbError) {
      console.error('[API Projects GET] Database connection error:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Veritabanına bağlanılamadı', 
        error: dbError instanceof Error ? dbError.message : 'Bilinmeyen hata',
        data: [] // Add empty array to ensure consistent format
      }, { status: 500 });
    }
    
    const projects = await prisma.project.findMany({
      include: {
        Customer: { select: { id: true, name: true } },     // Sadece gerekli alanları seç
        Department: { select: { id: true, name: true } }, // Sadece gerekli alanları seç
        Site: { select: { id: true, name: true } },         // Sadece gerekli alanları seç
        // tasks: true, // İhtiyaca göre eklenebilir
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date descending
      },
    });
    
    console.log(`[API Projects GET] Found ${projects.length} projects.`);
    
    // Frontend'in beklediği format ile yanıt dön
    return NextResponse.json({ 
      success: true, 
      data: projects,
      count: projects.length
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    let errorMessage = 'Projeler getirilirken bir sunucu hatası oluştu.';
    let errorCode = 'UNKNOWN';

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Veritabanı hatası: ${error.message} (Kod: ${error.code})`;
      errorCode = error.code;
      console.error(`Prisma Known Error (${errorCode}):`, error.message);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Generic Error:', error.message, error.stack);
    } else {
       console.error('Unknown Error Type:', error);
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: errorMessage, // Genel mesajı hata olarak da verelim
        errorCode: errorCode,
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint to create a new project
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, status, startDate, endDate, budget, managerId, teamMembers, departmentId } = body;

        // Basic validation
        if (!name) {
            return NextResponse.json({ success: false, message: 'Proje adı zorunludur.' }, { status: 400 });
        }

        // Check for required departmentId
        if (!departmentId) {
            console.warn('[API Projects POST] departmentId required field is missing');
            return NextResponse.json({ 
                success: false, 
                message: 'Departman ID zorunlu bir alandır. Lütfen bir departman seçin.' 
            }, { status: 400 });
        }

        // Frontend'den gelen status değerini backend enum'a çevir
        const mapStatusToBackend = (frontendStatus: string): 'PLANNING' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' => {
            const statusMap: Record<string, 'PLANNING' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'> = {
                'active': 'IN_PROGRESS',
                'planned': 'PLANNING',
                'completed': 'COMPLETED',
                'on-hold': 'ON_HOLD',
                'cancelled': 'CANCELLED'
            };
            
            // Eğer eşleşme bulunamazsa varsayılan değer dön
            return statusMap[frontendStatus] || 'PLANNING';
        };
        
        // Validate managerId if provided
        if (managerId) {
            try {
                const manager = await prisma.employee.findUnique({
                    where: { id: managerId }
                });
                
                if (!manager) {
                    return NextResponse.json({ 
                        success: false, 
                        message: `Geçersiz yönetici ID'si: ${managerId}. Bu ID'ye sahip çalışan bulunamadı.` 
                    }, { status: 400 });
                }
            } catch (error) {
                console.error('[API Projects POST] Error validating manager:', error);
                // managerId alanı kullanılmayacak - backend'de böyle bir alan yok
                // Sadece log amaçlı kontrol ediyoruz
            }
        }

        // Create the project with safer handling
        try {
            const newProject = await prisma.project.create({
                data: {
                    name,
                    description,
                    status: mapStatusToBackend(status || 'planned'), // Frontend'den backend'e dönüşüm
                    startDate: startDate ? new Date(startDate) : new Date(), // Provide current date if missing
                    endDate: endDate ? new Date(endDate) : null,
                    budget: budget ? parseFloat(budget) : null,
                    departmentId, // Make sure to include departmentId
                    // NOT: Backend'de managerId alanı bulunmuyor
                },
                include: { 
                    // Doğru ilişki isimleri kullanılmalıdır
                    Department: true, // Backend şemasında Department olarak tanımlı
                }
            });
            
            // NOT: Backend'de ProjectTeamMember modeli veya ilişkisi bulunmuyor
            // Takım üyeleri için ayrı bir tablo oluşturmak gerekecek
            // Şimdilik bu kısmı atlayalım
            
            return NextResponse.json({ success: true, data: newProject }, { status: 201 });
        } catch (prismaError) {
            console.error('[API Projects POST] Prisma Error:', prismaError);
            
            // More detailed error handling
            if (prismaError instanceof Prisma.PrismaClientKnownRequestError) {
                if (prismaError.code === 'P2002') { // Unique constraint violation
                    return NextResponse.json({ 
                        success: false, 
                        message: `Bu isimde bir proje zaten mevcut: ${prismaError.meta?.target}` 
                    }, { status: 409 });
                } else if (prismaError.code === 'P2003') { // Foreign key constraint failed
                    return NextResponse.json({ 
                        success: false, 
                        message: 'Geçersiz referans ID\'si sağlandı. Lütfen geçerli ID\'ler kullanın.' 
                    }, { status: 400 });
                }
            }
            
            // Generic database error
            return NextResponse.json({ 
                success: false, 
                message: 'Veritabanı işlemi sırasında bir hata oluştu.', 
                error: prismaError instanceof Error ? prismaError.message : 'Bilinmeyen veritabanı hatası' 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[API Projects POST] Error:', error);
        
        return NextResponse.json({ 
            success: false, 
            message: 'Proje oluşturulurken bir sunucu hatası oluştu.', 
            error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
        }, { status: 500 });
    }
} 