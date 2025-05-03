import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

// PUT: BEDAŞ bildirimi adımının referans numarasını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stepType: string } }
) {
  try {
    const { id, stepType } = params;
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepType} adımının referans numarası güncelleniyor...`);
    
    // Yetkilendirme kontrolü (geçici olarak devre dışı bırakıldı)
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, message: "Yetkilendirme hatası" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    
    // Backend'e istek gönder
    const response = await axios.put(
      `${BACKEND_URL}/api/edas/bedas/notifications/${id}/steps/${stepType}/ref-no`,
      body
    );
    
    console.log(`[BEDAS Frontend API] ${id} ID'li bildirimin ${stepType} adımının referans numarası başarıyla güncellendi.`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Bilinmeyen hata";
    const errorStack = error.stack || "";
    console.error(`[BEDAS Frontend API] ${params.id} ID'li bildirimin ${params.stepType} adımının referans numarası güncellenirken hata:`, error);
    console.error("[BEDAS Frontend API] Hata mesajı:", errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Referans numarası güncellenirken bir hata oluştu.",
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
} 