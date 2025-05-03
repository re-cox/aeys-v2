import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';

const prisma = new PrismaClient();

/**
 * Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
 */
export const getAllProgressPayments = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { projectId } = req.query;
    
    let progressPayments;
    
    if (projectId) {
      progressPayments = await prisma.progressPayment.findMany({
        where: { projectId: String(projectId) },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          documents: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      progressPayments = await prisma.progressPayment.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          documents: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    return res.status(200).json({ success: true, data: progressPayments });
  } catch (error) {
    console.error('Hakediş verileri alınırken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş verileri alınamadı', error });
  }
};

/**
 * Belirli bir hakediş detayını getir
 */
export const getProgressPaymentById = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { id } = req.params;
    
    const progressPayment = await prisma.progressPayment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true
      }
    });
    
    if (!progressPayment) {
      return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
    }
    
    return res.status(200).json({ success: true, data: progressPayment });
  } catch (error) {
    console.error('Hakediş detayı alınırken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş detayı alınamadı', error });
  }
};

/**
 * Yeni bir hakediş oluştur
 */
export const createProgressPayment = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { projectId, description, requestedAmount, dueDate, notes } = req.body;
    
    if (!projectId || !description || !requestedAmount) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }
    
    // Projenin var olup olmadığını kontrol et
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
    }
    
    // Bu proje için son hakediş numarasını bul
    const lastPayment = await prisma.progressPayment.findFirst({
      where: { projectId },
      orderBy: { paymentNumber: 'desc' }
    });
    
    const paymentNumber = lastPayment ? lastPayment.paymentNumber + 1 : 1;
    
    const progressPayment = await prisma.progressPayment.create({
      data: {
        projectId,
        paymentNumber,
        description,
        requestedAmount: parseFloat(requestedAmount.toString()),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: 'DRAFT'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true
      }
    });
    
    return res.status(201).json({ success: true, data: progressPayment });
  } catch (error) {
    console.error('Hakediş oluşturulurken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş oluşturulamadı', error });
  }
};

/**
 * Hakediş güncelle
 */
export const updateProgressPayment = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { id } = req.params;
    const { description, requestedAmount, dueDate, notes } = req.body;
    
    const progressPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!progressPayment) {
      return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
    }
    
    const updatedProgressPayment = await prisma.progressPayment.update({
      where: { id },
      data: {
        description,
        requestedAmount: requestedAmount ? parseFloat(requestedAmount.toString()) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true
      }
    });
    
    return res.status(200).json({ success: true, data: updatedProgressPayment });
  } catch (error) {
    console.error('Hakediş güncellenirken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş güncellenemedi', error });
  }
};

/**
 * Hakediş sil
 */
export const deleteProgressPayment = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { id } = req.params;
    
    const progressPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!progressPayment) {
      return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
    }
    
    // İlişkili belgeleri sil
    await prisma.progressPaymentDocument.deleteMany({
      where: { progressPaymentId: id }
    });
    
    // Hakediş kaydını sil
    await prisma.progressPayment.delete({
      where: { id }
    });
    
    return res.status(200).json({ success: true, message: 'Hakediş başarıyla silindi' });
  } catch (error) {
    console.error('Hakediş silinirken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş silinemedi', error });
  }
};

/**
 * Hakediş durumunu güncelle
 */
export const updateProgressPaymentStatus = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { id } = req.params;
    const { status, approvedAmount, paidAmount, paymentDate, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Durum bilgisi gereklidir' });
    }
    
    const progressPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!progressPayment) {
      return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
    }
    
    const updatedProgressPayment = await prisma.progressPayment.update({
      where: { id },
      data: {
        status,
        approvedAmount: approvedAmount ? parseFloat(approvedAmount.toString()) : undefined,
        paidAmount: paidAmount ? parseFloat(paidAmount.toString()) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        notes: notes !== undefined ? notes : progressPayment.notes
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true
      }
    });
    
    return res.status(200).json({ success: true, data: updatedProgressPayment });
  } catch (error) {
    console.error('Hakediş durumu güncellenirken hata:', error);
    return res.status(500).json({ success: false, message: 'Hakediş durumu güncellenemedi', error });
  }
};

/**
 * Proje finansal özetini getir
 */
export const getProjectFinancialSummary = async (req: Request, res: Response) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
    }

    const { id } = req.params; // Proje ID'si
    
    // Projenin var olup olmadığını kontrol et
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
    }
    
    // Projeye ait tüm hakedişleri getir
    const progressPayments = await prisma.progressPayment.findMany({
      where: { projectId: id }
    });
    
    // Finansal özeti hesapla
    const totalRequested = progressPayments.reduce((sum, payment) => sum + payment.requestedAmount, 0);
    const totalApproved = progressPayments.reduce((sum, payment) => sum + (payment.approvedAmount || 0), 0);
    const totalPaid = progressPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    const remainingBalance = totalApproved - totalPaid;
    const completionPercentage = totalApproved > 0 ? (totalPaid / totalApproved) * 100 : 0;
    
    const financialSummary = {
      projectId: id,
      projectName: project.name,
      totalRequested,
      totalApproved,
      totalPaid,
      remainingBalance,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // İki ondalık basamağa yuvarla
      paymentCount: progressPayments.length
    };
    
    return res.status(200).json({ success: true, data: financialSummary });
  } catch (error) {
    console.error('Proje finansal özeti alınırken hata:', error);
    return res.status(500).json({ success: false, message: 'Proje finansal özeti alınamadı', error });
  }
};