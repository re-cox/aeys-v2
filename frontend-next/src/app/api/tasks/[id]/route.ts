import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TaskStatus, TaskPriority, Prisma } from '@prisma/client';

// Yardımcı fonksiyon: İstekten ID'yi al
function getTaskId(params: { id?: string }) {
  const { id } = params;
  if (!id) {
    throw new Error('Görev ID\'si bulunamadı.');
  }
  return id;
}

// Tek bir görevi getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = getTaskId(params);
    console.log(`[API Task GET /${taskId}] İstek alındı`);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            profilePictureUrl: true,
            position: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        department: { // Departmanı da dahil edelim
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      console.log(`[API Task GET /${taskId}] Görev bulunamadı`);
      return NextResponse.json({ success: false, error: 'Görev bulunamadı' }, { status: 404 });
    }

    console.log(`[API Task GET /${taskId}] Görev başarıyla bulundu`);
    return NextResponse.json({ success: true, data: task });

  } catch (error) {
    console.error(`[API Task GET /${params.id || 'unknown'}] Hata:`, error);
    // Prisma'nın özel "kayıt bulunamadı" hatasını yakala
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ success: false, error: 'Görev bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      error: 'Görev alınamadı',
      message: error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası'
    }, { status: 500 });
  }
}

// Görevi güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = getTaskId(params);
    console.log(`[API Task PUT /${taskId}] İstek alındı`);
    const data = await req.json();
    console.log(`[API Task PUT /${taskId}] Gelen veri:`, data);

    // assigneeIds bir dizi olarak gelmeli, değilse veya yoksa boş dizi yap
    const assigneeIds = Array.isArray(data.assigneeIds) ? data.assigneeIds : [];

    // Güncelleme verisini hazırla
    const updateData: Prisma.TaskUpdateInput = {
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      // İlişkili alanları 'connect' ile güncelle
      project: data.projectId ? { connect: { id: data.projectId } } : undefined, // Varsa bağlan, yoksa dokunma
      department: data.departmentId ? { connect: { id: data.departmentId } } : undefined, // Varsa bağlan, yoksa dokunma
      // Atananları güncelle: set ile mevcutları silip yenilerini ekler
      assignees: {
        set: assigneeIds.map((id: string) => ({ id })) // Her zaman set et, boş dizi ise bağlantıları kaldırır
      }
    };

    // Boş gelen ana alanları güncelleme verisinden çıkar (undefined olanlar zaten Prisma tarafından atlanır)
    if (updateData.title === undefined) delete updateData.title;
    if (updateData.description === undefined) delete updateData.description;
    if (updateData.status === undefined) delete updateData.status;
    if (updateData.priority === undefined) delete updateData.priority;
    if (data.dueDate === undefined) delete updateData.dueDate; // 'data' kontrolü önemli

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { // Güncelleme sonrası veriyi ilişkilerle döndür
        assignees: {
          select: { id: true, name: true, surname: true, profilePictureUrl: true },
        },
        project: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      },
    });

    console.log(`[API Task PUT /${taskId}] Görev başarıyla güncellendi`);
    return NextResponse.json({ success: true, data: updatedTask });

  } catch (error) {
    console.error(`[API Task PUT /${params.id || 'unknown'}] Hata:`, error);
     // Prisma'nın özel "kayıt bulunamadı" hatasını yakala (güncellenecek görev yoksa)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ success: false, error: 'Güncellenecek görev bulunamadı' }, { status: 404 });
    }
     // İlişki hatası (geçersiz assigneeId veya projectId)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
       return NextResponse.json({ 
         success: false, 
         error: 'Geçersiz ilişki anahtarı',
         message: `İlişkili alan (${(error.meta as any)?.field_name}) için geçersiz ID sağlandı.` 
        }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: 'Görev güncellenemedi',
      message: error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası'
    }, { status: 500 });
  }
}

// Görevi sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = getTaskId(params);
    console.log(`[API Task DELETE /${taskId}] İstek alındı`);

    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log(`[API Task DELETE /${taskId}] Görev başarıyla silindi`);
    // Başarılı silme işleminde genellikle 204 No Content döndürülür
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`[API Task DELETE /${params.id || 'unknown'}] Hata:`, error);
    // Prisma'nın özel "kayıt bulunamadı" hatasını yakala (silinecek görev yoksa)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ success: false, error: 'Silinecek görev bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      error: 'Görev silinemedi',
      message: error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası'
    }, { status: 500 });
  }
} 