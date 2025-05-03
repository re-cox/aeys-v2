import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: ID'ye göre iş programı getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[WorkSchedule API] GET isteği alındı. ID: ${id}`);
    
    try {
      // Şimdilik boş bir obje dönelim, Prisma modelleri yeniden generate edildikten sonra çalışacak
      return NextResponse.json({
        id: id,
        title: "Geçici İş Programı",
        description: "",
        type: "OTHER",
        status: "PLANNED",
        priority: "MEDIUM",
        departmentId: "",
        department: { id: "", name: "" },
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        employees: []
      });
    } catch (innerError) {
      console.error(`[WorkSchedule API] Model veya tablo bulunamadı (ID: ${id}):`, innerError);
      return NextResponse.json(
        { error: 'İş programı bulunamadı.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`[WorkSchedule API] GET hatası (ID: ${params.id}):`, error);
    return NextResponse.json(
      { error: 'İş programı yüklenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// PUT: İş programını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[WorkSchedule API] PUT isteği alındı. ID: ${id}`);
    
    const body = await request.json();
    
    try {
      // Şimdilik gelen veriyi aynen geri dönelim
      return NextResponse.json({
        id: id,
        ...body,
        updatedAt: new Date().toISOString()
      });
    } catch (innerError) {
      console.error(`[WorkSchedule API] Model veya tablo bulunamadı (ID: ${id}):`, innerError);
      return NextResponse.json(
        { error: 'İş programı bulunamadı.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`[WorkSchedule API] PUT hatası (ID: ${params.id}):`, error);
    return NextResponse.json(
      { error: 'İş programı güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// DELETE: İş programını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[WorkSchedule API] DELETE isteği alındı. ID: ${id}`);
    
    // Başarı bilgisi dön
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[WorkSchedule API] DELETE hatası (ID: ${params.id}):`, error);
    return NextResponse.json(
      { error: 'İş programı silinirken bir hata oluştu.' },
      { status: 500 }
    );
  }
} 