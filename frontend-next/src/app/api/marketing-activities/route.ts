// NOT: Bu dosya artık kullanılmıyor. 
// MarketingActivity verileri doğrudan backend'den çekiliyor.
// Sorun çıkması durumunda geri dönülebilmesi için bu dosya korundu.

import { NextResponse } from 'next/server';
// Kullanılmayan importları kaldırdık
// import prisma from '@/lib/prisma';
// import { ActivityType, ActivityStatus } from '@prisma/client';

// GET - Tüm aktiviteleri listele (KULLANILMIYOR - Frontend şimdi backend'e istek yapıyor)
export async function GET(_request: Request) {
  // İstekleri backend'e yönlendir
  return NextResponse.json(
    { message: 'Bu API artık kullanılmıyor. İstekler backend API\'sine yönlendirildi.' }, 
    { status: 307 }
  );
}

// POST - Yeni aktivite oluştur (KULLANILMIYOR - Frontend şimdi backend'e istek yapıyor)
export async function POST(request: Request) {
  // İstekleri backend'e yönlendir
  return NextResponse.json(
    { message: 'Bu API artık kullanılmıyor. İstekler backend API\'sine yönlendirildi.' }, 
    { status: 307 }
  );
}

// Eski kodlar aşağıdadır (referans için saklandı):
/*
// GET - Tüm aktiviteleri listele
export async function GET(_request: Request) {
  console.log('[Marketing API] GET isteği alındı.');
  try {
    // Veritabanından tüm aktiviteleri çek
    const activities = await prisma.marketingActivity.findMany({
      include: {
        customer: true,   // İlişkili müşteri bilgilerini dahil et
        employee: true,   // İlişkili çalışan bilgilerini dahil et
      },
      orderBy: {
        activityDate: 'desc', // En yeni aktiviteleri önce göster
      },
    });
    
    console.log(`[Marketing API] ${activities.length} aktivite başarıyla çekildi.`);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('[Marketing API] GET hatası:', error);
    return NextResponse.json(
      { message: 'Aktiviteler alınırken bir hata oluştu.' }, 
      { status: 500 }
    );
  }
}

// POST - Yeni aktivite oluştur
export async function POST(request: Request) {
  console.log('[Marketing API] POST isteği alındı.');
  try {
    const body = await request.json();
    console.log('[Marketing API] Gelen veri:', body);

    // Gelen veriyi doğrula ve hazırla
    const activityData = {
      type: body.type,
      status: body.status || ActivityStatus.PLANNED,
      activityDate: new Date(body.activityDate),
      title: body.title,
      description: body.description,
      outcome: body.outcome,
      nextStep: body.nextStep,
      nextStepDate: body.nextStepDate ? new Date(body.nextStepDate) : undefined,
      locationLink: body.locationLink,
      customerId: body.customerId,
      employeeId: body.employeeId,
    };

    // Veritabanına kaydet
    const newActivity = await prisma.marketingActivity.create({
      data: activityData,
      include: {
        customer: true,
        employee: true,
      },
    });

    console.log('[Marketing API] Yeni aktivite oluşturuldu:', newActivity.id);
    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error('[Marketing API] POST hatası:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Geçersiz JSON formatı.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Aktivite oluşturulurken bir hata oluştu.' }, 
      { status: 500 }
    );
  }
}
*/ 