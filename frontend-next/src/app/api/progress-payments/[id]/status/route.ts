import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Hakediş durumunu güncelle
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
    
    // Gerekli alanları kontrol et
    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'Durum bilgisi gereklidir' },
        { status: 400 }
      );
    }
    
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
    const updateData: any = {
      status: body.status
    };
    
    // Durum bazlı alan güncellemeleri
    if (['APPROVED', 'PAID'].includes(body.status)) {
      if (body.approvedAmount !== undefined) {
        updateData.approvedAmount = body.approvedAmount;
      }
    }
    
    if (['PAID'].includes(body.status)) {
      if (body.paidAmount !== undefined) {
        updateData.paidAmount = body.paidAmount;
      }
      
      if (body.paymentDate !== undefined) {
        updateData.paymentDate = body.paymentDate ? new Date(body.paymentDate) : null;
      }
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
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
    console.error('Hakediş durumu güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Hakediş durumu güncellenemedi', error: String(error) },
      { status: 500 }
    );
  }
}