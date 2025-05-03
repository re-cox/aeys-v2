import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// GET: BEDAŞ bildirimine ait belgeyi indir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id, documentId } = params;
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${documentId} ID'li belgesi indiriliyor...`);
    
    // Backend'e istek gönder
    const response = await axios.get(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/documents/${documentId}`,
      { responseType: 'arraybuffer' }
    );
    
    // Dosya başlık bilgilerini al
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'document';
    
    // Content-Disposition başlığından dosya adını çıkarmaya çalış
    if (contentDisposition) {
      const matches = /filename="([^"]+)"/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }
    
    // Dosyayı doğrudan ilet
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType || 'application/octet-stream');
    responseHeaders.set('Content-Disposition', contentDisposition || `attachment; filename="${filename}"`);
    
    return new NextResponse(response.data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${params.id} ID'li bildirimin ${params.documentId} ID'li belgesi indirilirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Belge indirilirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE: BEDAŞ bildirimine ait belgeyi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id, documentId } = params;
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${documentId} ID'li belgesi siliniyor...`);
    
    // Backend'e istek gönder
    const response = await axios.delete(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/documents/${documentId}`
    );
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${documentId} ID'li belgesi başarıyla silindi.`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${params.id} ID'li bildirimin ${params.documentId} ID'li belgesi silinirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Belge silinirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
} 