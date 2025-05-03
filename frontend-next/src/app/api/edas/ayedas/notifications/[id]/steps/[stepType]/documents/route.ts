import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stepType: string } }
) {
  try {
    const { id, stepType } = params;
    console.log(`[API] Belge yükleme isteği alındı - ID: ${id}, StepType: ${stepType}`);
    
    // Form verisini al
    const formData = await request.formData();
    const documentType = formData.get("documentType") as string;
    const files = formData.getAll("files") as File[];
    
    console.log(`[API] Belge türü: ${documentType}, Dosya sayısı: ${files.length}`);
    
    if (!documentType) {
      console.log(`[API] Hata: Belge türü belirtilmedi`);
      return NextResponse.json(
        { success: false, message: "Belge türü belirtilmedi." },
        { status: 400 }
      );
    }
    
    if (files.length === 0) {
      console.log(`[API] Hata: Dosya seçilmedi`);
      return NextResponse.json(
        { success: false, message: "Dosya seçilmedi." },
        { status: 400 }
      );
    }
    
    // Bildirimi kontrol et
    const notification = await prisma.edasNotification.findUnique({
      where: { id, company: "AYEDAŞ" }
    });
    
    if (!notification) {
      console.log(`[API] Hata: Bildirim bulunamadı - ID: ${id}`);
      return NextResponse.json(
        { success: false, message: "Bildirim bulunamadı." },
        { status: 404 }
      );
    }
    
    // İlgili adımı bul
    console.log(`[API] Adım kontrol ediliyor - NotificationId: ${id}, StepType: ${stepType}`);
    let step = await prisma.edasNotificationStep.findFirst({
      where: {
        notificationId: id,
        stepType
      }
    });
    
    // Adım yoksa veya adım ID'si sayı formatında değilse uyarı ver
    if (!step) {
      console.log(`[API] Hata: Adım bulunamadı, önce adım oluşturulmalı`);
      return NextResponse.json(
        { success: false, message: "Belge yüklemeden önce adımı oluşturmalısınız." },
        { status: 400 }
      );
    }
    
    console.log(`[API] Adım bulundu - ID: ${step.id}`);
    
    // Dosya yükleme klasörünü oluştur
    const uploadDir = join(process.cwd(), "public", "uploads", "edas", "ayedas", id, stepType);
    console.log(`[API] Yükleme dizini: ${uploadDir}`);
    
    try {
      if (!existsSync(uploadDir)) {
        console.log(`[API] Dizin mevcut değil, oluşturuluyor: ${uploadDir}`);
        await mkdir(uploadDir, { recursive: true });
        console.log(`[API] Dizin başarıyla oluşturuldu`);
      } else {
        console.log(`[API] Dizin zaten mevcut`);
      }
    } catch (dirError) {
      console.error(`[API] Dizin oluşturma hatası:`, dirError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Dosya yükleme dizini oluşturulamadı.", 
          error: (dirError as Error).message 
        },
        { status: 500 }
      );
    }
    
    // Dosyaları kaydet ve veritabanına ekle
    const uploadedDocuments = [];
    
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const fileName = `${Date.now()}-${originalName.replace(/\s+/g, "-")}`;
        const filePath = join(uploadDir, fileName);
        
        console.log(`[API] Dosya kaydediliyor: ${fileName}`);
        
        // Dosyayı diske kaydet
        await writeFile(filePath, buffer);
        console.log(`[API] Dosya diske kaydedildi: ${filePath}`);
        
        // Veritabanına kaydet
        const document = await prisma.edasNotificationDocument.create({
          data: {
            stepId: step.id,
            fileName: originalName,
            documentType,
            path: `/uploads/edas/ayedas/${id}/${stepType}/${fileName}`, // Frontend'den erişilebilir yol
            mimeType: file.type,
            size: file.size
          }
        });
        
        console.log(`[API] Belge veritabanına kaydedildi - ID: ${document.id}`);
        uploadedDocuments.push(document);
      } catch (fileError) {
        console.error(`[API] Dosya işleme hatası: ${file.name}`, fileError);
        throw new Error(`${file.name} dosyası işlenirken hata oluştu: ${(fileError as Error).message}`);
      }
    }
    
    console.log(`[API] Toplam ${uploadedDocuments.length} belge başarıyla yüklendi`);
    
    // Adımı güncellenen belgeleriyle birlikte al
    const updatedStep = await prisma.edasNotificationStep.findUnique({
      where: { id: step.id },
      include: { documents: true }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        step: updatedStep,
        documents: uploadedDocuments
      },
      message: `${uploadedDocuments.length} belge başarıyla yüklendi.`
    });
  } catch (error) {
    console.error("[API] Belge yüklenirken hata:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Belge yüklenirken bir hata oluştu.",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : "Sunucu hatası"
      },
      { status: 500 }
    );
  }
} 