import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Proje finansal özetini getir
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
    
    // Proje kontrolü
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Proje bulunamadı' },
        { status: 404 }
      );
    }
    
    // Proje hakedişlerini getir
    const progressPayments = await prisma.progressPayment.findMany({
      where: { projectId: id }
    });
    
    // Finansal özet hesaplamaları
    const totalRequestedAmount = progressPayments.reduce((sum, payment) => sum + payment.requestedAmount, 0);
    const totalApprovedAmount = progressPayments.reduce((sum, payment) => sum + (payment.approvedAmount || 0), 0);
    const totalPaidAmount = progressPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    
    // Sözleşme bedeli (varsayılan olarak proje bütçesi kullanılıyor)
    const contractAmount = project.budget || 0;
    
    // Kalan bakiye
    const remainingBalance = contractAmount - totalPaidAmount;
    
    // Tamamlanma yüzdesi
    const completionPercentage = contractAmount > 0 ? (totalPaidAmount / contractAmount) * 100 : 0;
    
    // Finansal özet
    const financialSummary = {
      projectId: project.id,
      projectName: project.name,
      contractAmount,
      totalRequestedAmount,
      totalApprovedAmount,
      totalPaidAmount,
      remainingBalance,
      completionPercentage
    };
    
    return NextResponse.json({
      success: true,
      data: financialSummary
    });
  } catch (error) {
    console.error('Proje finansal özeti alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Proje finansal özeti alınamadı', error: String(error) },
      { status: 500 }
    );
  }
}