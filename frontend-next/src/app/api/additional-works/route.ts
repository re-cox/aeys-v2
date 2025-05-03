import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      employeeId: string; 
      email: string; 
      name: string; 
      role: string; 
    };
    
    return {
      id: decoded.employeeId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    return null;
  }
}

// GET: Fetch all additional works with optional filters
export async function GET(req: NextRequest) {
  try {
    console.log('[AdditionalWorks API] GET request received');
    
    // Try to get next-auth session
    const session = await getServerSession(authOptions);
    
    // Try to verify JWT token if no next-auth session
    const tokenUser = session ? null : await verifyToken(req);
    
    if (!session && !tokenUser) {
      console.log('[AdditionalWorks API] Unauthorized access attempt');
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const user = session?.user || tokenUser;
    console.log('[AdditionalWorks API] Authorized user:', user?.email);

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    
    console.log('[AdditionalWorks API] Query params:', { query, status, priority, assignedToId });

    // Build the filter object
    const filter: any = {
      where: {},
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            phoneNumber: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Add filters to the where clause
    if (query) {
      filter.where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { technicianNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    if (status) {
      filter.where.status = status;
    }

    if (priority) {
      filter.where.priority = priority;
    }

    if (assignedToId) {
      filter.where.assignedToId = assignedToId;
    }

    console.log('[AdditionalWorks API] Executing database query with filter:', JSON.stringify(filter, null, 2));

    // Fetch additional works from the database
    const additionalWorks = await prisma.additionalWork.findMany(filter);

    console.log('[AdditionalWorks API] Query successful, found', additionalWorks.length, 'records');

    return NextResponse.json({
      success: true,
      data: additionalWorks
    });
  } catch (error) {
    console.error("[AdditionalWorks API] Error in GET /api/additional-works:", error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("[AdditionalWorks API] Error name:", error.name);
      console.error("[AdditionalWorks API] Error message:", error.message);
      console.error("[AdditionalWorks API] Error stack:", error.stack);
    }
    
    // Hata durumunda da tutarlı bir format döndür
    return new NextResponse(JSON.stringify({ 
      success: false, 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// POST: Create a new additional work
export async function POST(req: NextRequest) {
  try {
    // Try to get next-auth session
    const session = await getServerSession(authOptions);
    
    // Try to verify JWT token if no next-auth session
    const tokenUser = session ? null : await verifyToken(req);
    
    if (!session && !tokenUser) {
      console.log('[AdditionalWorks API] Unauthorized access attempt for POST');
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const user = session?.user || tokenUser;
    console.log('[AdditionalWorks API] Authorized user for POST:', user?.email);

    // Parse the request body
    const body = await req.json();
    console.log('[AdditionalWorks API] Received POST body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const { 
      title, 
      description, 
      status, 
      startDate, 
      assignedToId, 
      priority, 
      technicianNumber, 
      endDate // endDate'i de body'den alalım
    } = body;
    
    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!status) {
      return new NextResponse(JSON.stringify({ error: "Status is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!startDate) {
      return new NextResponse(JSON.stringify({ error: "Start date is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    if (!priority) {
      return new NextResponse(JSON.stringify({ error: "Priority is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const userId = user?.id;
    if (!userId) {
      console.error('[AdditionalWorks API] User ID not found in session/token');
      return new NextResponse(JSON.stringify({ error: "User authentication error" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Veritabanına yazılacak veriyi oluştur
    const dataToCreate: any = {
      title,
      description: description || null,
      status,
      priority,
      technicianNumber: technicianNumber || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null, // Doğrudan body'den alınan endDate kullanıldı
      createdBy: { connect: { id: userId } },
      assignedToId: assignedToId || null, 
    };
    
    // --- DETAYLI LOGLAMA VE KONTROL BAŞLANGICI ---
    console.log("[!!!] Prisma'ya gönderilecek son veri:", JSON.stringify(dataToCreate, null, 2));

    // Alan kontrolleri
    if (typeof dataToCreate.title !== 'string' || dataToCreate.title.trim() === '') {
      console.error('[!!!] HATA: Title geçersiz:', dataToCreate.title);
      throw new Error('Başlık alanı geçersiz.');
    }
    if (dataToCreate.description !== null && typeof dataToCreate.description !== 'string') {
       console.error('[!!!] HATA: Description tipi geçersiz:', dataToCreate.description);
       throw new Error('Açıklama alanı tipi geçersiz.');
    }
    if (typeof dataToCreate.status !== 'string' || dataToCreate.status.trim() === '') {
      console.error('[!!!] HATA: Status geçersiz:', dataToCreate.status);
      throw new Error('Durum alanı geçersiz.');
    }
    if (typeof dataToCreate.priority !== 'string' || dataToCreate.priority.trim() === '') {
      console.error('[!!!] HATA: Priority geçersiz:', dataToCreate.priority);
      throw new Error('Öncelik alanı geçersiz.');
    }
    if (dataToCreate.technicianNumber !== null && typeof dataToCreate.technicianNumber !== 'string') {
       console.error('[!!!] HATA: TechnicianNumber tipi geçersiz:', dataToCreate.technicianNumber);
       throw new Error('Teknisyen No alanı tipi geçersiz.');
    }
    if (!(dataToCreate.startDate instanceof Date) || isNaN(dataToCreate.startDate.getTime())) {
      console.error('[!!!] HATA: StartDate geçersiz:', dataToCreate.startDate, 'Orijinal:', startDate);
      throw new Error('Başlangıç tarihi geçersiz.');
    }
    if (dataToCreate.endDate !== null && (!(dataToCreate.endDate instanceof Date) || isNaN(dataToCreate.endDate.getTime()))) {
      console.error('[!!!] HATA: EndDate geçersiz:', dataToCreate.endDate, 'Orijinal:', endDate);
      throw new Error('Bitiş tarihi geçersiz.');
    }
    if (dataToCreate.assignedToId !== null && typeof dataToCreate.assignedToId !== 'string') {
       console.error('[!!!] HATA: AssignedToId tipi geçersiz:', dataToCreate.assignedToId);
       throw new Error('Atanan kişi ID tipi geçersiz.');
    }
    if (!dataToCreate.createdBy || !dataToCreate.createdBy.connect || typeof dataToCreate.createdBy.connect.id !== 'string'){
        console.error('[!!!] HATA: CreatedBy bağlantısı geçersiz:', dataToCreate.createdBy);
        throw new Error('Oluşturan kişi bağlantısı geçersiz.');
    }
    // --- DETAYLI LOGLAMA VE KONTROL BİTİŞİ ---

    console.log('[AdditionalWorks API] Data to create (validated):', JSON.stringify(dataToCreate, null, 2));

    // Create the additional work
    const newAdditionalWork = await prisma.additionalWork.create({
      data: dataToCreate,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            surname: true,
            phoneNumber: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        }
      },
    });

    return NextResponse.json({
      success: true,
      data: newAdditionalWork
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/additional-works:", error);
    
    let errorMessage = "Internal Server Error";
    let statusCode = 500;
    let errorDetails: any = {};

    // Prisma ile ilgili spesifik hataları yakala
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Veritabanı Hatası: Kod ${error.code}`;
      errorDetails = error.meta || { target: error.message }; // Hata detayları
      statusCode = 400; // Genellikle client kaynaklı veri hatası
      
      // Daha açıklayıcı hata mesajları
      if (error.code === 'P2002') {
        errorMessage = 'Bu bilgilerle zaten bir kayıt mevcut';
      } else if (error.code === 'P2025') {
        errorMessage = 'İlişkili kayıt bulunamadı';
      }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      errorMessage = "Veri Doğrulama Hatası";
      errorDetails = error.message; // Hatanın detayı
      statusCode = 400;
      
      console.log("Prisma Validation Error Detayı:", error.message);
      
      // Hata mesajından alan adını çıkarmaya çalış
      const fieldMatch = error.message.match(/Unknown field '(\w+)'/i);
      if (fieldMatch && fieldMatch[1]) {
        errorMessage = `Bilinmeyen alan: '${fieldMatch[1]}'`;
      }
      
      // Eksik zorunlu alan kontrolü
      const requiredMatch = error.message.match(/Argument `(\w+)` is missing/i);
      if (requiredMatch && requiredMatch[1]) {
        errorMessage = `Zorunlu alan eksik: '${requiredMatch[1]}'`;
      }
      
      // Veri tipi uyumsuzluğu
      const typeMatch = error.message.match(/Argument `([^`]+)` must not be null/i);
      if (typeMatch && typeMatch[1]) {
        errorMessage = `'${typeMatch[1]}' alanı null olamaz`;
      }
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    
    console.error("API Error Details:", errorDetails);

    return new NextResponse(JSON.stringify({ 
      error: errorMessage, 
      details: errorDetails // Hata detaylarını da gönderelim
    }), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 