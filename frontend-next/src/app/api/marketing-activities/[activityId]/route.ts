import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ActivityType, ActivityStatus } from '@prisma/client';

interface Params {
  params: {
    activityId: string;
  };
}

// Belirli bir aktiviteyi getir
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { activityId } = params;
    const activity = await prisma.marketingActivity.findUnique({
      where: { id: activityId },
       include: {
        customer: { select: { id: true, companyName: true } },
        employee: { select: { id: true, name: true, surname: true } },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Aktivite bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Aktivite getirme hatası (ID):", error);
    return NextResponse.json({ error: 'Aktivite alınamadı' }, { status: 500 });
  }
}

// Aktiviteyi güncelle
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { activityId } = params;
    const data = await req.json();

    const updatedActivity = await prisma.marketingActivity.update({
      where: { id: activityId },
      data: {
        type: data.type as ActivityType,
        status: data.status as ActivityStatus,
        activityDate: data.activityDate ? new Date(data.activityDate) : undefined,
        title: data.title,
        description: data.description,
        outcome: data.outcome,
        nextStep: data.nextStep,
        nextStepDate: data.nextStepDate ? new Date(data.nextStepDate) : null,
        locationLink: data.locationLink,
        customerId: data.customerId,
        employeeId: data.employeeId,
      },
       include: {
        customer: { select: { id: true, companyName: true } },
        employee: { select: { id: true, name: true, surname: true } },
      },
    });
    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Aktivite güncelleme hatası:", error);
    if ((error as any).code === 'P2025') {
       return NextResponse.json({ error: 'Güncellenecek aktivite bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Aktivite güncellenemedi' }, { status: 500 });
  }
}

// Aktiviteyi sil
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { activityId } = params;
    await prisma.marketingActivity.delete({
      where: { id: activityId },
    });
    return NextResponse.json({ message: 'Aktivite başarıyla silindi' });
  } catch (error) {
    console.error("Aktivite silme hatası:", error);
     if ((error as any).code === 'P2025') {
       return NextResponse.json({ error: 'Silinecek aktivite bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Aktivite silinemedi' }, { status: 500 });
  }
} 