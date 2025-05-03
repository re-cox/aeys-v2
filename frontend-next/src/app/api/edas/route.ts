import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Tüm EDAŞ bildirimlerini getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    
    // Filtreleme için sorgu oluştur
    const where = company ? { company } : {};
    
    // Bildirimleri ve adımlarını getir
    const notifications = await prisma.edasNotification.findMany({
      where,
      include: {
        steps: {
          include: {
            documents: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Bildirimler alınırken hata oluştu:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bildirimler getirilirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
      },
      { status: 500 }
    );
  }
}

// Yeni bildirim oluştur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Gerekli alanlar kontrolü
    const requiredFields = ['refNo', 'customerName', 'company', 'applicationType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} alanı zorunludur.` },
          { status: 400 }
        );
      }
    }
    
    // Referans numarasının benzersizliğini kontrol et
    const existingNotification = await prisma.edasNotification.findUnique({
      where: { refNo: body.refNo }
    });
    
    if (existingNotification) {
      return NextResponse.json(
        { success: false, message: 'Bu referans numarasına sahip bir bildirim zaten var.' },
        { status: 400 }
      );
    }
    
    // Bildirim ve ilk aşamasını transaction içinde oluştur
    const result = await prisma.$transaction(async (tx) => {
      console.log('Transaction başlatıldı.');
      // Yeni bildirimi oluştur
      const notification = await tx.edasNotification.create({
        data: {
          refNo: body.refNo,
          projectName: body.projectName || null,
          applicationType: body.applicationType,
          customerName: body.customerName,
          city: body.city || null,
          district: body.district || null,
          parcelBlock: body.parcelBlock || null,
          parcelNo: body.parcelNo || null,
          company: body.company,
          currentStep: body.company === 'AYEDAŞ' ? 'IC_TESISAT_PROJESI' : 'PROJE',
          status: 'PENDING'
        }
      });
      
      console.log(`Bildirim oluşturuldu: ID=${notification.id}`);
      
      // İlk aşamayı oluştur
      const firstStepType = body.company === 'AYEDAŞ' ? 'IC_TESISAT_PROJESI' : 'PROJE';
      
      await tx.edasNotificationStep.create({
        data: {
          notificationId: notification.id,
          stepType: firstStepType,
          status: 'PENDING',
          notes: 'Bildirim oluşturuldu.'
        }
      });
      
      console.log(`İlk adım (${firstStepType}) oluşturuldu.`);
      
      // Oluşturulan bildirimi getir
      return await tx.edasNotification.findUnique({
        where: { id: notification.id },
        include: {
          steps: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
    });
    
    console.log('Tüm işlemler başarıyla tamamlandı.');
    return NextResponse.json({
      success: true,
      message: 'Bildirim başarıyla oluşturuldu.',
      data: result
    });
  } catch (error) {
    console.error('Bildirim oluşturulurken hata oluştu:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bildirim oluşturulurken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
      },
      { status: 500 }
    );
  }
} 