import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { headers } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// POST: BEDAŞ bildirimi adımına belge yükle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } } // stepType -> stepId
) {
  try {
    const { id, stepId } = params; // stepType -> stepId
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımına belge yükleniyor...`); // stepType -> stepId

    // Formdata'yı kopyalama
    const formData = await request.formData();
    
    // İsteği doğrudan backend'e ilet
    const response = await axios.post(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/steps/${stepId}/documents`, // stepType -> stepId
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Gerekirse backend'e gönderilecek ek header'lar (örn. Auth)
          Authorization: request.headers.get('Authorization') || undefined,
        },
      }
    );
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımına belge başarıyla yüklendi.`); // stepType -> stepId
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Parametreleri tekrar okumaya çalışalım (hata durumunda undefined olabilir)
    const notificationId = params?.id || 'Bilinmeyen ID';
    const stepIdentifier = params?.stepId || 'Bilinmeyen Adım'; 
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${notificationId} ID'li bildirimin ${stepIdentifier} adımına belge yüklenirken hata:`, error); // stepType -> stepId
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Belge yüklenirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

// GET: BEDAŞ bildirimi adımının belgelerini getir (Listeleme)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } } // stepType -> stepId
) {
  try {
    const { id, stepId } = params; // stepType -> stepId
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımının belgeleri isteniyor...`); // stepType -> stepId
    
    // Backend'e istek gönder
    const response = await axios.get(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/steps/${stepId}/documents`, // stepType -> stepId
      {
        headers: {
           // Gerekirse backend'e gönderilecek ek header'lar (örn. Auth)
           Authorization: request.headers.get('Authorization') || undefined,
        }
      }
    );
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımının belgeleri başarıyla alındı.`); // stepType -> stepId
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Parametreleri tekrar okumaya çalışalım
    const notificationId = params?.id || 'Bilinmeyen ID';
    const stepIdentifier = params?.stepId || 'Bilinmeyen Adım';
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${notificationId} ID'li bildirimin ${stepIdentifier} adımının belgeleri getirilirken hata:`, error); // stepType -> stepId
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Belgeler getirilirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
} 