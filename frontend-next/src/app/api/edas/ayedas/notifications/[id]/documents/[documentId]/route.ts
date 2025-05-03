import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unlink, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET: Belge indirme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id, documentId } = params;
    
    // Belgeyi bul
    const document = await prisma.edasNotificationDocument.findUnique({
      where: { id: documentId },
      include: {
        step: {
          include: {
            notification: true
          }
        }
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, message: "Belge bulunamadı." },
        { status: 404 }
      );
    }
    
    // Doğru bildirimin belgesi mi kontrol et
    if (document.step.notification.id !== id || document.step.notification.company !== "AYEDAŞ") {
      return NextResponse.json(
        { success: false, message: "Belge bulunamadı." },
        { status: 404 }
      );
    }
    
    // Dosya yolunu oluştur
    const filePath = join(process.cwd(), "public", document.path);
    
    // Dosya var mı kontrol et
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "Dosya bulunamadı." },
        { status: 404 }
      );
    }
    
    // Dosyayı oku
    const fileBuffer = await readFile(filePath);
    
    // İndirme yanıtı
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.originalName}"`,
      }
    });
  } catch (error) {
    console.error("Belge indirilirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Belge indirilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

// DELETE: Belge silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id, documentId } = params;
    
    // Belgeyi bul
    const document = await prisma.edasNotificationDocument.findUnique({
      where: { id: documentId },
      include: {
        step: {
          include: {
            notification: true
          }
        }
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, message: "Belge bulunamadı." },
        { status: 404 }
      );
    }
    
    // Doğru bildirimin belgesi mi kontrol et
    if (document.step.notification.id !== id || document.step.notification.company !== "AYEDAŞ") {
      return NextResponse.json(
        { success: false, message: "Belge bulunamadı." },
        { status: 404 }
      );
    }
    
    // Dosya yolunu oluştur
    const filePath = join(process.cwd(), "public", document.path);
    
    // Dosya varsa sil
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (err) {
        console.error("Dosya silinirken hata:", err);
        // Dosya silinemezse bile veritabanından kaldırmaya devam et
      }
    }
    
    // Veritabanından sil
    await prisma.edasNotificationDocument.delete({
      where: { id: documentId }
    });
    
    return NextResponse.json({
      success: true,
      message: "Belge başarıyla silindi."
    });
  } catch (error) {
    console.error("Belge silinirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Belge silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
} 