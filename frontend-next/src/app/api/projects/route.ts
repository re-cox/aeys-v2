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
        const { name, description, status, priority, startDate, endDate, budget, managerId, teamMembers } = body;

        // Basic validation
        if (!name) {
            return NextResponse.json({ success: false, message: 'Proje adı zorunludur.' }, { status: 400 });
        }

        // Validate managerId if provided
        if (managerId) {
            const manager = await prisma.employee.findUnique({
                where: { id: managerId }
            });
            
            if (!manager) {
                return NextResponse.json({ 
                    success: false, 
                    message: `Geçersiz yönetici ID'si: ${managerId}. Bu ID'ye sahip çalışan bulunamadı.` 
                }, { status: 400 });
            }
        }

        // Create the project with safer handling
        try {
            const newProject = await prisma.project.create({
                data: {
                    name,
                    description,
                    status: status || 'PLANNING', // Ensure valid value with default
                    priority: priority || 'MEDIUM', // Ensure valid value with default
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    budget: budget ? parseFloat(budget) : null,
                    managerId,
                    // Team members will be added in a separate operation if needed
                },
                include: { // Include relations in the response
                    manager: true,
                }
            });
            
            // Handle team members separately if provided
            if (teamMembers && teamMembers.length > 0) {
                for (const memberId of teamMembers) {
                    // Check if employee exists
                    const employee = await prisma.employee.findUnique({
                        where: { id: memberId }
                    });
                    
                    if (!employee) {
                        console.warn(`Ekip üyesi eklenemedi: ${memberId} ID'li çalışan bulunamadı.`);
                        continue;
                    }
                    
                    // Add team member
                    await prisma.projectTeamMember.create({
                        data: {
                            projectId: newProject.id,
                            employeeId: memberId,
                        }
                    });
                }
                
                // Re-fetch project with team after adding members
                const projectWithTeam = await prisma.project.findUnique({
                    where: { id: newProject.id },
                    include: {
                        manager: true,
                        team: { include: { employee: true } },
                    }
                });
                
                return NextResponse.json({ success: true, data: projectWithTeam }, { status: 201 });
            }

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
                        message: 'Geçersiz yönetici veya ekip üyesi ID\'si sağlandı. Lütfen geçerli ID\'ler kullanın.' 
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