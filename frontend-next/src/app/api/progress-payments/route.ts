import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Tüm hakedişleri getir veya proje ID'sine göre filtrele
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }
    
    // URL'den proje ID'sini al (varsa)
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    // Filtreleme koşulları
    const where = projectId && projectId !== 'all' ? { projectId } : {};
    
    // Hakedişleri getir
    const progressPayments = await prisma.progressPayment.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        documents: true
      }
    });
    
    // API yanıtını formatla
    const formattedPayments = progressPayments.map(payment => ({
      id: payment.id,
      projectId: payment.projectId,
      projectName: payment.project.name,
      paymentNumber: payment.paymentNumber,
      description: payment.description,
      createdAt: payment.createdAt.toISOString(),
      dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
      requestedAmount: payment.requestedAmount,
      approvedAmount: payment.approvedAmount,
      paidAmount: payment.paidAmount,
      status: payment.status,
      paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : null,
      documents: payment.documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        uploadDate: doc.uploadDate.toISOString(),
        fileSize: doc.fileSize
      })),
      notes: payment.notes
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Hakediş verileri alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş verileri alınamadı', error: String(error) },
      { status: 500 }
    );
  }
}

// Yeni hakediş oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.projectId || !body.description || body.requestedAmount === undefined) {
      return NextResponse.json(
        { success: false, message: 'Eksik veya geçersiz veri' },
        { status: 400 }
      );
    }
    
    // Proje kontrolü
    const project = await prisma.project.findUnique({
      where: { id: body.projectId }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Proje bulunamadı' },
        { status: 404 }
      );
    }
    
    // Son hakediş numarasını bul
    const lastPayment = await prisma.progressPayment.findFirst({
      where: { projectId: body.projectId },
      orderBy: { paymentNumber: 'desc' }
    });
    
    const nextPaymentNumber = lastPayment ? lastPayment.paymentNumber + 1 : 1;
    
    // Yeni hakediş oluştur
    const newPayment = await prisma.progressPayment.create({
      data: {
        projectId: body.projectId,
        paymentNumber: nextPaymentNumber,
        description: body.description,
        requestedAmount: body.requestedAmount,
        status: 'DRAFT',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: newPayment.id,
        projectId: newPayment.projectId,
        projectName: newPayment.project.name,
        paymentNumber: newPayment.paymentNumber,
        description: newPayment.description,
        createdAt: newPayment.createdAt.toISOString(),
        dueDate: newPayment.dueDate ? newPayment.dueDate.toISOString() : null,
        requestedAmount: newPayment.requestedAmount,
        approvedAmount: newPayment.approvedAmount,
        paidAmount: newPayment.paidAmount,
        status: newPayment.status,
        paymentDate: newPayment.paymentDate ? newPayment.paymentDate.toISOString() : null,
        documents: [],
        notes: newPayment.notes
      }
    });
  } catch (error) {
    console.error('Hakediş oluşturulurken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş oluşturulamadı', error: String(error) },
      { status: 500 }
    );
  }
}