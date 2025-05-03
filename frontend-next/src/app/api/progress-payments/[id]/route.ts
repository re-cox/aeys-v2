import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Belirli bir hakediş kaydını getir
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    const payment = await prisma.progressPayment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            name: true
          }
        },
        documents: true
      }
    });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Hakediş bulunamadı' },
        { status: 404 }
      );
    }
    
    // API yanıtını formatla
    const formattedPayment = {
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
    };
    
    return NextResponse.json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş detayı alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş detayı alınamadı', error: String(error) },
      { status: 500 }
    );
  }
}

// Hakediş kaydını güncelle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Hakediş kontrolü
    const existingPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return NextResponse.json(
        { success: false, message: 'Hakediş bulunamadı' },
        { status: 404 }
      );
    }
    
    // Güncellenecek alanları hazırla
    const updateData: any = {};
    
    if (body.description !== undefined) updateData.description = body.description;
    if (body.requestedAmount !== undefined) updateData.requestedAmount = body.requestedAmount;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Hakediş güncelle
    const updatedPayment = await prisma.progressPayment.update({
      where: { id },
      data: updateData,
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
    const formattedPayment = {
      id: updatedPayment.id,
      projectId: updatedPayment.projectId,
      projectName: updatedPayment.project.name,
      paymentNumber: updatedPayment.paymentNumber,
      description: updatedPayment.description,
      createdAt: updatedPayment.createdAt.toISOString(),
      dueDate: updatedPayment.dueDate ? updatedPayment.dueDate.toISOString() : null,
      requestedAmount: updatedPayment.requestedAmount,
      approvedAmount: updatedPayment.approvedAmount,
      paidAmount: updatedPayment.paidAmount,
      status: updatedPayment.status,
      paymentDate: updatedPayment.paymentDate ? updatedPayment.paymentDate.toISOString() : null,
      documents: updatedPayment.documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        uploadDate: doc.uploadDate.toISOString(),
        fileSize: doc.fileSize
      })),
      notes: updatedPayment.notes
    };
    
    return NextResponse.json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş güncellenemedi', error: String(error) },
      { status: 500 }
    );
  }
}

// Hakediş kaydını sil
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Hakediş kontrolü
    const existingPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return NextResponse.json(
        { success: false, message: 'Hakediş bulunamadı' },
        { status: 404 }
      );
    }
    
    // İlişkili belgeleri sil
    await prisma.progressPaymentDocument.deleteMany({
      where: { progressPaymentId: id }
    });
    
    // Hakediş kaydını sil
    await prisma.progressPayment.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Hakediş başarıyla silindi'
    });
  } catch (error) {
    console.error('Hakediş silinirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş silinemedi', error: String(error) },
      { status: 500 }
    );
  }
}