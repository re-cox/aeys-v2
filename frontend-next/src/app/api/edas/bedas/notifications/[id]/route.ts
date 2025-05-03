import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// GET: Belirli bir BEDAŞ bildirimini getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirim detayı isteniyor...`);
    
    // Backend'e istek gönder
    const response = await axios.get(`${BACKEND_URL}/api/edas/bedas/notifications/${id}`);
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirim başarıyla alındı.`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${id} ID'li bildirim detayı getirilirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Bildirim detayı getirilirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE: Belirli bir BEDAŞ bildirimini sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirim silme işlemi başlatıldı...`);
    
    // Backend'e istek gönder
    const response = await axios.delete(`${BACKEND_URL}/api/edas/bedas/notifications/${id}`);
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirim başarıyla silindi. Durum: ${response.status}`);
    
    // Başarılı silme durumunu kontrol et
    if (response.status === 204) {
      // 204 No Content - Gövdesiz yanıt döndür
      return new NextResponse(null, { status: 204 });
    } else {
      // Diğer başarılı durumlar (200 OK gibi - beklenmese de)
      // Sabit başarı mesajı ile JSON döndür
      return NextResponse.json({ success: true, message: "Bildirim başarıyla silindi." }, { status: response.status });
    }

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${id} ID'li bildirim silinirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Bildirim silinirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
} 