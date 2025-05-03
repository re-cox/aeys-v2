import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// PUT: Adım durumunu güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stepType: string } }
) {
  try {
    const { id, stepType } = params;
    const { status, notes } = await request.json();

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz durum değeri." },
        { status: 400 }
      );
    }

    // Önce bildirimi kontrol et
    const notification = await prisma.edasNotification.findUnique({
      where: { id, company: "AYEDAŞ" },
      include: {
        steps: true
      }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }

    // Adımı bul veya oluştur
    let step = await prisma.edasNotificationStep.findFirst({
      where: {
        notificationId: id,
        stepType: stepType
      }
    });

    if (step) {
      // Mevcut adımı güncelle
      step = await prisma.edasNotificationStep.update({
        where: {
          id: step.id
        },
        data: {
          status,
          notes: notes || step.notes
        }
      });
    } else {
      // Yeni adım oluştur
      step = await prisma.edasNotificationStep.create({
        data: {
          notificationId: id,
          stepType,
          status,
          notes: notes || null
        }
      });
    }

    // Bildirim güncel adım ve durumunu güncelle
    let updatedNotification = notification;
    
    // Eğer onaylanan bir adım varsa ve bu en son adımsa bildirim durumunu güncelle
    if (status === "APPROVED") {
      // Bildirim için adımları sırala 
      const stepOrder = [
        "IC_TESISAT_PROJESI",
        "BAGLANTI_GORUSU",
        "BAGLANTI_HATTI_TESISI",
        "BAGLANTI_BEDELI",
        "DAGITIM_BAGLANTI_ANLASMASI",
        "SAYAC_MONTAJ_BEDELI",
        "GECICI_KABUL",
        "TESISAT_MUAYENE",
        "TESISAT"
      ];
      
      // Güncel adımın indeksi
      const currentStepIndex = stepOrder.indexOf(stepType);
      
      // Bir sonraki adım (varsa)
      const nextStepType = currentStepIndex < stepOrder.length - 1 
        ? stepOrder[currentStepIndex + 1] 
        : null;
      
      // Bildirim güncelleme
      updatedNotification = await prisma.edasNotification.update({
        where: { id },
        data: {
          currentStep: nextStepType || stepType,
          // Eğer bu son adımsa ve onaylandıysa, bildirimi de onayla
          status: !nextStepType && status === "APPROVED" ? "APPROVED" : notification.status
        }
      });
    } else if (status === "REJECTED") {
      // Reddedilen adım varsa, bildirimi de reddet
      updatedNotification = await prisma.edasNotification.update({
        where: { id },
        data: {
          status: "REJECTED"
        }
      });
    }

    // Yolu yeniden doğrula
    revalidatePath("/edas/ayedas");
    revalidatePath(`/edas/ayedas/bildirim/${id}`);

    return NextResponse.json({
      success: true,
      data: {
        step,
        notification: updatedNotification
      },
      message: "Adım başarıyla güncellendi."
    });
  } catch (error) {
    console.error("Adım güncellenirken hata:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Adım güncellenirken bir hata oluştu.",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
} 