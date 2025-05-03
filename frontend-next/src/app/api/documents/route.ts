import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DocumentType, DocumentCategory } from '@/types/document';
import { Prisma, PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { JwtPayload } from 'jsonwebtoken';

// Define interface for our token payload
interface AuthTokenPayload extends JwtPayload {
  employeeId?: string;
}

// GET: Tüm dokümanları listele
export async function GET(request: NextRequest) {
  try {
    console.log('[Documents API] GET isteği alındı.');
    
    // URL parametrelerini al (filtreleme için)
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const type = searchParams.get('type') as DocumentType | null;
    const category = searchParams.get('category') as DocumentCategory | null;
    const uploadedById = searchParams.get('uploadedBy');
    const folderId = searchParams.get('folderId');
    
    // Filtreleme koşulları
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (uploadedById) where.uploadedById = uploadedById;
    
    // Klasör filtrelemesi
    if (folderId === 'root' || folderId === 'null') {
      // Kök klasördeki dosyaları getir (folderId null olanlar)
      where.folderId = null;
    } else if (folderId) {
      // Belirli bir klasördeki dosyaları getir
      where.folderId = folderId;
    }
    
    // Dokümanları getir (yükleyen kişi ve klasör bilgisi dahil)
    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('[Documents API] GET hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Dokümanlar yüklenirken bir hata oluştu.',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        data: [] // Tutarlı format için boş dizi
      },
      { status: 500 }
    );
  }
}

// POST: Yeni doküman oluştur
export async function POST(request: NextRequest) {
  try {
    console.log('[Documents API] POST isteği alındı.');
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('[Documents API] Gelen authorization başlığı:', authHeader ? `${authHeader.substring(0, 15)}...` : 'yok');
    
    const token = await verifyAuthToken(request);
    
    if (!token) {
      console.log('[Documents API] Token doğrulanamadı');
      return NextResponse.json(
        { 
          success: false,
          error: 'Yetkilendirme hatası', 
          details: 'Bu işlem için geçerli bir oturum gerekiyor. Lütfen tekrar giriş yapın.',
          data: null
        },
        { status: 401 }
      );
    }
    
    // Cast token to our typed interface and get employee ID
    const typedToken = token as AuthTokenPayload;
    
    if (!typedToken.employeeId) {
      console.log('[Documents API] Token içinde employeeId bilgisi yok:', JSON.stringify(typedToken));
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçersiz yetkilendirme', 
          details: 'Kullanıcı kimliği alınamadı. Token içinde çalışan ID bilgisi yok.',
          data: null
        },
        { status: 401 }
      );
    }
    
    const authenticatedEmployeeId = typedToken.employeeId;
    console.log(`[Documents API] Doğrulanmış çalışan ID: ${authenticatedEmployeeId}`);
    
    const body = await request.json();
    console.log('[Documents API] POST verileri:', JSON.stringify(body, null, 2));
    
    // Gerekli alanları kontrol et
    if (!body.fileName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Dosya adı gereklidir.', 
          details: 'fileName alanı eksik.',
          data: null
        },
        { status: 400 }
      );
    }
    
    if (!body.fileUrl && !body.path) {
      return NextResponse.json(
        {
          success: false, 
          error: 'Dosya yolu gereklidir.', 
          details: 'fileUrl veya path alanlarından biri eksik.',
          data: null
        },
        { status: 400 }
      );
    }
    
    // Use authenticated employee ID instead of the one in the request body
    // Prisma model şemasına uygun alanlara çevir
    const createData: any = {
      fileName: body.fileName, 
      originalName: body.originalName || body.fileName, // Gerekli alan
      path: body.path || body.fileUrl, // Path alanı için fileUrl veya path kullan
      mimeType: body.mimeType || body.fileType || 'application/octet-stream', // Varsayılan
      documentType: body.documentType || body.type || 'OTHER',
      size: body.size || body.fileSize || 0,
      uploadedById: authenticatedEmployeeId, // Use authenticated ID
      folderId: body.folderId || null,
    };
    
    console.log('[Documents API] Create data:', JSON.stringify(createData, null, 2));
    
    // Dokümanı oluştur
    const document = await prisma.document.create({
      data: createData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    console.log('[Documents API] Doküman başarıyla oluşturuldu. ID:', document.id);
    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('[Documents API] POST hatası:', error);
    
    let errorMessage = 'Doküman oluşturulurken bir hata oluştu.';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = `Doküman oluşturulurken hata: ${error.name}`;
      errorDetails = error.message;
      console.error('[Documents API] Hata detayları:', error.message);
      
      if (error.stack) {
        console.error('[Documents API] Stack:', error.stack);
      }
    }
    
    // Prisma hata kodlarını kontrol et
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        // This specific error code indicates a foreign key constraint violation
        errorMessage = 'Geçersiz referans';
        const meta = (error as any).meta;
        
        if (meta?.field_name?.includes('uploadedById')) {
          errorDetails = 'Verilen kullanıcı ID (uploadedById) mevcut değil. Lütfen oturum açtığınızdan emin olun.';
          console.error('[Documents API] Kimliği doğrulanmış kullanıcı ID veritabanında bulunamadı.');
        } else {
          errorDetails = `Referans hatası: ${meta?.field_name || 'bilinmeyen alan'}`;
        }
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: errorDetails,
        data: null
      },
      { status: 500 }
    );
  }
} 