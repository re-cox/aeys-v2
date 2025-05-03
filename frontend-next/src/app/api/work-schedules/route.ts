import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkScheduleStatus, WorkScheduleType, WorkSchedulePriority } from '@/types/workSchedule';
import { Prisma } from '@prisma/client';

// GET: İş programlarını listele
export async function GET(request: NextRequest) {
  try {
    console.log('[WorkSchedule API] GET isteği alındı.');
    
    // URL parametrelerini al (filtreleme için)
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const type = searchParams.get('type') as WorkScheduleType | null;
    const status = searchParams.get('status') as WorkScheduleStatus | null;
    const priority = searchParams.get('priority') as WorkSchedulePriority | null;
    const departmentId = searchParams.get('departmentId');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Filtreleme koşullarını oluştur
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    if (startDate && endDate) {
      where.OR = [
        // Başlangıç tarihi belirtilen aralıkta
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        // Bitiş tarihi belirtilen aralıkta
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        // Başlangıç tarihi aralık başlangıcından önce ve bitiş tarihi aralık sonundan sonra (kapsayan)
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } }
          ]
        }
      ];
    }
    
    if (employeeId) {
      where.employees = {
        some: {
          employeeId: employeeId
        }
      };
    }
    
    try {
      // Önce boş bir array dönelim, sonraki deploymentta gerekli düzenlemeler yapılacak
      // Prisma modelleri yeniden generate edildikten sonra çalışacak
      return NextResponse.json([]);
    } catch (innerError) {
      console.error('[WorkSchedule API] Model veya tablo bulunamadı:', innerError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('[WorkSchedule API] GET hatası:', error);
    return NextResponse.json(
      { error: 'İş programları yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// POST: Yeni iş programı oluştur
export async function POST(request: NextRequest) {
  try {
    console.log('[WorkSchedule API] POST isteği alındı.');
    
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.title || !body.departmentId || !body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Başlık, departman, tür, başlangıç ve bitiş tarihi belirtmelisiniz.' },
        { status: 400 }
      );
    }
    
    try {
      // Şimdilik boş bir obje dönelim, Prisma modelleri yeniden generate edildikten sonra çalışacak
      return NextResponse.json({
        id: "tmp-" + Date.now(),
        title: body.title,
        description: body.description,
        departmentId: body.departmentId,
        type: body.type,
        status: body.status || 'PLANNED',
        priority: body.priority || 'MEDIUM',
        startDate: body.startDate,
        endDate: body.endDate,
        employees: []
      });
    } catch (innerError) {
      console.error('[WorkSchedule API] Model veya tablo bulunamadı:', innerError);
      return NextResponse.json(
        { error: 'İş programı oluşturulurken bir hata oluştu. Veritabanı güncellemesi gerekiyor.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[WorkSchedule API] POST hatası:', error);
    return NextResponse.json(
      { error: 'İş programı oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 