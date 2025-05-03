import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// GET: Tüm BEDAŞ bildirimlerini getir
export async function GET(request: NextRequest) {
  try {
    console.log("[BEDAS Frontend API] Bildirimler isteniyor...");
    
    // URL'den sorgu parametrelerini al
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    
    // Backend URL'i
    let apiUrl = `${BACKEND_URL}/api/edas/bedas/notifications`;
    
    // Varsa sorgu parametrelerini ekle
    if (status) {
      apiUrl += `?status=${status}`;
    }
    
    // Backend'den verileri getir
    const response = await axios.get(apiUrl);
    
    console.log(`[BEDAS Frontend API] ${response.data.data.length} bildirim başarıyla alındı.`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error("[BEDAS Frontend API] Bildirimler getirilirken hata:", error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Bildirimler getirilirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

// POST: Yeni BEDAŞ bildirimi oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("[BEDAS Frontend API] Yeni bildirim isteği alındı:", body);
    
    // Zorunlu alanları kontrol et
    const requiredFields = ["refNo", "customerName", "applicationType"];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error(`[BEDAS Frontend API] Eksik zorunlu alanlar: ${missingFields.join(", ")}`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Zorunlu alanlar eksik: ${missingFields.join(", ")}` 
        },
        { status: 400 }
      );
    }
    
    // Backend'e istek gönder
    console.log(`[BEDAS Frontend API] Backend'e istek gönderiliyor: ${BACKEND_URL}/api/edas/bedas/notifications`);
    
    const response = await axios.post(`${BACKEND_URL}/api/edas/bedas/notifications`, body);
    
    console.log(`[BEDAS Frontend API] Backend yanıtı alındı:`, response.status, response.statusText);
    console.log(`[BEDAS Frontend API] Backend yanıt içeriği:`, response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    const statusCode = error.response?.status || 500;
    const responseData = error.response?.data || {};
    
    console.error("[BEDAS Frontend API] Bildirim oluşturulurken hata:", error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    console.error("[BEDAS Frontend API] Hata kodu:", statusCode);
    console.error("[BEDAS Frontend API] Backend yanıtı:", responseData);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Bildirim oluşturulurken bir hata oluştu.",
        error: errorMessage,
        details: responseData,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: statusCode }
    );
  }
} 