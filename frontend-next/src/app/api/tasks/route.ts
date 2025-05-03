import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TaskStatus, TaskPriority } from '@prisma/client'; // Enumları import et

// Tüm görevleri getir (opsiyonel filtrelerle)
export async function GET(req: NextRequest) {
  try {
    console.log('[API Tasks GET] Görevler için GET isteği alındı');
    
    // Veritabanı bağlantısı kontrolü
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('[API Tasks GET] Veritabanı bağlantısı başarılı');
    } catch (dbError) {
      console.error('[API Tasks GET] Veritabanı bağlantı hatası:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Veritabanına bağlanılamadı', 
        message: dbError instanceof Error ? dbError.message : 'Bilinmeyen hata'
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(req.url);
    // Filtreler (assigneeId kaldırıldı, yerine assignees filtresi eklenebilir ama şimdilik basit tutalım)
    const status = searchParams.get('status') as TaskStatus | null;
    const priority = searchParams.get('priority') as TaskPriority | null;
    // const assigneeId = searchParams.get('assigneeId') as string | null; // Kaldırıldı
    const projectId = searchParams.get('projectId') as string | null;

    console.log(`[API Tasks GET] Filtreler: status=${status}, priority=${priority}, projectId=${projectId}`);

    // Filtreleme koşullarını oluştur
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        // assignees ilişkisini dahil et
        assignees: {
          select: { 
            id: true, 
            name: true, 
            surname: true, // Soyadını da alalım
            email: true, 
            profilePictureUrl: true // Profil resmini de alalım
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc', // Varsayılan olarak en yeni görevler üstte
      },
    });

    console.log(`[API Tasks GET] ${tasks.length} görev bulundu`);

    return NextResponse.json({ 
      success: true, 
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error("Görevleri getirme hatası:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'Görevler alınamadı',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}

// Yeni görev oluştur
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Gerekli alan kontrolü
    if (!data.title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Görev başlığı zorunludur' 
      }, { status: 400 });
    }

    console.log("Gelen görev verileri:", data);

    // Veritabanı bağlantısı kontrolü
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
    } catch (dbError) {
      console.error('[API Tasks POST] Database connection error:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Veritabanına bağlanılamadı', 
        message: dbError instanceof Error ? dbError.message : 'Bilinmeyen hata'
      }, { status: 500 });
    }

    // assigneeIds bir dizi olarak gelmeli
    const assigneeIds = Array.isArray(data.assigneeIds) ? data.assigneeIds : [];

    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus || TaskStatus.TODO,
        priority: data.priority as TaskPriority || TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId || null,
        // assignees ilişkisini kullanarak birden fazla kişiyi bağla
        assignees: {
          connect: assigneeIds.map((id: string) => ({ id }))
        }
      },
      include: {
        // Oluşturduktan sonra assignees'i de döndür
        assignees: {
          select: { 
            id: true, 
            name: true, 
            surname: true,
            email: true,
            profilePictureUrl: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log("Oluşturulan görev:", newTask);

    return NextResponse.json({
      success: true,
      data: newTask
    }, { status: 201 });
  } catch (error) {
    console.error("Görev oluşturma hatası:", error);
    // assigneeIds veya projectId geçersizse P2025 hatası dönebilir
    if ((error as any).code === 'P2025') { 
      return NextResponse.json({ 
        success: false, 
        error: 'Geçersiz ilişki (assigneeIds veya projectId)', 
        message: (error as any).meta?.cause || 'Bir veya daha fazla atanan kişi veya proje bulunamadı'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Görev oluşturulamadı',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 