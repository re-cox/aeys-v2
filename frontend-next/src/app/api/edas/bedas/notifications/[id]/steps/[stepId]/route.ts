import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// PUT: BEDAŞ bildirimi adımının durumunu güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const { id, stepId } = params;
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımının durumu güncelleniyor...`);
    
    const body = await request.json();
    
    // Backend'e istek gönder
    const response = await axios.put(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/steps/${stepId}`,
      body
    );
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepId} adımının durumu başarıyla güncellendi.`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${params.id} ID'li bildirimin ${params.stepId} adımının durumu güncellenirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Adım durumu güncellenirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
} 