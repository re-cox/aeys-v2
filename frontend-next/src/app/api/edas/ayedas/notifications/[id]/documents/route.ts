import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Bir bildirimin tüm belgelerini getirme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Bildirimi kontrol et
    const notification = await prisma.edasNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }

    // Şirket AYEDAŞ değilse hata döndür
    if (notification.company !== "AYEDAŞ") {
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }

    // Tüm belgeleri getir
    const documents = await prisma.edasNotificationDocument.findMany({
      where: {
        step: {
          notificationId: id
        }
      },
      include: {
        step: true
      }
    });

    return NextResponse.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return NextResponse.json(
      { success: false, message: "Belgeler getirilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

// POST: Yeni belge yükleme
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const formData = await request.formData();
    
    const stepType = formData.get("stepType") as string;
    const documentType = formData.get("documentType") as string;
    const files = formData.getAll("files") as File[];

    if (!stepType || !documentType || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "Adım tipi, belge tipi ve dosya(lar) gereklidir." },
        { status: 400 }
      );
    }

    // Bildirimi kontrol et
    const notification = await prisma.edasNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }

    // Şirket AYEDAŞ değilse hata döndür
    if (notification.company !== "AYEDAŞ") {
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }

    // Transaction ile adım ve belgeleri oluştur/güncelle
    const result = await prisma.$transaction(async (tx) => {
      // Adımı bul veya oluştur
      let step = await tx.edasNotificationStep.findFirst({
        where: {
          notificationId: id,
          stepType
        }
      });

      if (!step) {
        step = await tx.edasNotificationStep.create({
          data: {
            notificationId: id,
            stepType,
            status: "PENDING"
          }
        });
      }

      // Belgeleri yükle ve kaydet
      const uploadedDocuments = [];
      for (const file of files) {
        // Dosyayı disk'e kaydet
        const fileName = `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", id, stepType);
        const filePath = path.join(uploadDir, fileName);

        try {
          // Klasör yoksa oluştur
          await mkdir(uploadDir, { recursive: true });
          
          // Dosya içeriğini oku
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          
          // Dosyayı disk'e yaz
          await writeFile(filePath, fileBuffer);

          // Belgeyi veritabanına kaydet
          const document = await tx.edasNotificationDocument.create({
            data: {
              stepId: step.id,
              fileName,
              originalName: file.name,
              documentType,
              path: `/uploads/${id}/${stepType}/${fileName}`,
              mimeType: file.type,
              size: file.size
            }
          });

          uploadedDocuments.push(document);
        } catch (err) {
          console.error("Error saving file:", err);
          throw new Error("Dosya kaydedilirken bir hata oluştu.");
        }
      }

      return uploadedDocuments;
    });

    // Yolu yeniden doğrula
    revalidatePath(`/edas/ayedas/bildirim/${id}`);

    return NextResponse.json({
      success: true,
      message: "Belgeler başarıyla yüklendi.",
      data: result
    });
  } catch (error) {
    console.error("Error uploading documents:", error);
    return NextResponse.json(
      { success: false, message: "Belgeler yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 