import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
// import { PrismaClient } from '@prisma/client'; // Yorumlandı
// import { getServerSession } from 'next-auth'; // Yorumlandı
// import { authOptions } from '../lib/auth'; // Yorumlandı
import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';

// const prisma = new PrismaClient(); // Yorumlandı

// Tüm hakedişleri listele
export const getAllProgressPayments = async (req: Request, res: Response) => {
  try {
    // Proje ID'si ile filtreleme
    const { projectId } = req.query;
    const whereClause = projectId ? { projeId: projectId as string } : {};

    const hakedisler = await prisma.hakedis.findMany({
      where: whereClause,
      include: {
        proje: {
          select: {
            id: true,
            name: true,
          },
        },
        olusturan: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        onaylayan: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        hakedisTarihi: 'desc',
      },
    });

    // Frontend'in beklediği formata dönüştür
    const progressPayments = hakedisler.map((hakedis: any) => {
      // Hakediş numarasından sayısal kısmı çıkar
      const paymentNumber = hakedis.hakedisNo.split('-')[2] 
        ? parseInt(hakedis.hakedisNo.split('-')[2])
        : 0;

      // Durumu map'le
      const statusMap: { [key: string]: string } = {
        'TASLAK': 'DRAFT',
        'ONAY_BEKLIYOR': 'PENDING',
        'ONAYLANDI': 'APPROVED',
        'ODENDI': 'PAID',
        'REDDEDILDI': 'REJECTED',
        'IPTAL_EDILDI': 'REJECTED'
      };

      return {
        id: hakedis.id,
        projectId: hakedis.projeId,
        projectName: hakedis.proje?.name || "",
        paymentNumber: paymentNumber,
        description: hakedis.aciklama || "",
        createdAt: hakedis.createdAt.toISOString(),
        dueDate: hakedis.hakedisTarihi.toISOString(),
        requestedAmount: hakedis.tutar,
        approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        status: statusMap[hakedis.durum] || 'DRAFT',
        paymentDate: hakedis.odemeTarihi ? hakedis.odemeTarihi.toISOString() : null,
        notes: null as string | null,
        documents: [] as Array<{fileName: string, fileUrl: string}>
      };
    });

    return res.status(200).json({
      data: progressPayments
    });
  } catch (error) {
    console.error('Hakedişleri getirme hatası:', error);
    return res.status(500).json({ message: 'Hakedişler alınırken bir sunucu hatası oluştu.' });
  }
};

export const getProgressPaymentById = async (req: Request, res: Response) => { 
  try {
    const { id } = req.params;
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
      include: {
        proje: {
          select: {
            id: true,
            name: true,
          },
        },
        olusturan: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        onaylayan: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!hakedis) {
      return res.status(404).json({ message: 'Hakediş bulunamadı.' });
    }

    // Frontend'in beklediği formata dönüştür
    // Hakediş numarasından sayısal kısmı çıkar
    const paymentNumber = hakedis.hakedisNo.split('-')[2] 
      ? parseInt(hakedis.hakedisNo.split('-')[2])
      : 0;

    // Durumu map'le
    const statusMap: { [key: string]: string } = {
      'TASLAK': 'DRAFT',
      'ONAY_BEKLIYOR': 'PENDING',
      'ONAYLANDI': 'APPROVED',
      'ODENDI': 'PAID',
      'REDDEDILDI': 'REJECTED',
      'IPTAL_EDILDI': 'REJECTED'
    };

    const progressPayment = {
      id: hakedis.id,
      projectId: hakedis.projeId,
      projectName: hakedis.proje?.name || "",
      paymentNumber: paymentNumber,
      description: hakedis.aciklama || "",
      createdAt: hakedis.createdAt.toISOString(),
      dueDate: hakedis.hakedisTarihi.toISOString(),
      requestedAmount: hakedis.tutar,
      approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
      paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
      status: statusMap[hakedis.durum] || 'DRAFT',
      paymentDate: hakedis.odemeTarihi ? hakedis.odemeTarihi.toISOString() : null,
      notes: hakedis.aciklama || null,
      documents: [] as Array<{fileName: string, fileUrl: string}>
    };

    return res.status(200).json({
      data: progressPayment
    });
  } catch (error) {
    console.error('Hakediş getirme hatası:', error);
    return res.status(500).json({ message: 'Hakediş alınırken bir sunucu hatası oluştu.' });
  }
};

export const createProgressPayment = async (req: Request, res: Response) => { 
  try {
    // Detaylı request bilgilerini logla
    console.log('Gelen istek methodu:', req.method);
    console.log('Gelen istek headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Gelen istek body (ham):', req.body);
    console.log('Gelen dosyalar:', req.files);
    
    // Gelen veriler
    const projectId = req.body.projectId;
    const hakedisNo = req.body.hakedisNo; // Client tarafından gelen hakediş numarası
    const description = req.body.description;
    const requestedAmount = req.body.requestedAmount;
    const dueDate = req.body.dueDate;
    const notes = req.body.notes;
    
    console.log('İşlenecek veriler:', {
      projectId,
      hakedisNo,
      description,
      requestedAmount,
      dueDate,
      notes
    });
    
    // Değerlerin doğruluğunu kontrol et
    if (!projectId || projectId === 'undefined') {
      console.error('Proje ID eksik veya geçersiz:', projectId);
      return res.status(400).json({ message: 'Proje ID (projectId) zorunludur' });
    }

    if (!hakedisNo || hakedisNo === 'undefined') {
      return res.status(400).json({ message: 'Hakediş numarası (hakedisNo) zorunludur' });
    }

    if (!description || description === 'undefined') {
      return res.status(400).json({ message: 'Açıklama (description) zorunludur' });
    }

    if (!requestedAmount || requestedAmount === 'undefined') {
      return res.status(400).json({ message: 'Talep edilen tutar (requestedAmount) zorunludur' });
    }

    // Kullanıcı bilgisi - Auth'tan gelmeli, şimdilik hardcoded
    const olusturanId = "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // req.user.id olmalı normalde
    
    // Tarihler: İlerleme dönemi için varsayılan olarak mevcut ayın başlangıcı ve sonu
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Hakediş vade tarihi, eğer belirtilmişse kullan
    const hakedisTarihi = dueDate ? new Date(dueDate) : now;
    
    // KDV ve toplam tutarı hesapla
    const kdvOrani = 0.20; // %20 varsayılan
    
    // requestedAmount string veya number olabilir, doğru formata dönüştür
    let tutar: number;
    
    if (typeof requestedAmount === 'string') {
      tutar = parseFloat(requestedAmount);
    } else if (typeof requestedAmount === 'number') {
      tutar = requestedAmount;
    } else {
      return res.status(400).json({ 
        message: 'Geçersiz tutar formatı', 
        receivedType: typeof requestedAmount,
        receivedValue: requestedAmount
      });
    }
      
    if (isNaN(tutar)) {
      return res.status(400).json({ 
        message: 'Talep edilen tutar geçerli bir sayı değil',
        receivedValue: requestedAmount 
      });
    }
    
    const kdvTutar = tutar * kdvOrani;
    const toplamTutar = tutar + kdvTutar;
    
    // Açıklamayı hazırla
    const aciklama = notes 
      ? `${description} - ${notes}` 
      : description;
    
    // Dosyaları kontrol et ve işle
    let uploadedDocuments: Array<{fileName: string, fileUrl: string, fileType: string, uploadDate: string, fileSize: number}> = [];
    
    if (req.files && Object.keys(req.files).length > 0) {
      console.log('Dosya yükleme işlemi başlatılıyor...');
      
      // files bir dizi veya obje olabilir
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      
      // Yüklenecek dizin oluştur
      const uploadDir = path.join(__dirname, '../../uploads/hakedis');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (const file of files) {
        if (file) {
          const uploadedFile = file as UploadedFile;
          const uniqueFilename = `${Date.now()}-${uploadedFile.name}`;
          const filePath = path.join(uploadDir, uniqueFilename);
          
          // Dosyayı taşı
          await uploadedFile.mv(filePath);
          
          // Döküman bilgisini kaydet
          uploadedDocuments.push({
            fileName: uploadedFile.name,
            fileUrl: `/uploads/hakedis/${uniqueFilename}`,
            fileType: uploadedFile.mimetype,
            uploadDate: new Date().toISOString(),
            fileSize: uploadedFile.size
          });
        }
      }
      
      console.log('Yüklenen dosyalar:', uploadedDocuments);
    }
    
    try {
      // Veritabanına kaydet
      console.log('Veritabanına kaydedilecek veri:', {
        hakedisNo,
        projeId: projectId,
        aciklama,
        tutar,
        hakedisTarihi: hakedisTarihi.toISOString()
      });
      
      const newProgressPayment = await prisma.hakedis.create({
        data: {
          hakedisNo,
          projeId: projectId,
          aciklama,
          hakedisTarihi,
          baslangicTarihi: firstDayOfMonth,
          bitisTarihi: lastDayOfMonth,
          tutar,
          kdvOrani,
          kdvTutar,
          toplamTutar,
          paraBirimi: "TRY",
          durum: 'TASLAK',
          olusturanId
        },
        include: {
          proje: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Hakediş numarasından sayısal kısmı çıkar
      const paymentNumber = newProgressPayment.hakedisNo.split('-')[2] 
        ? parseInt(newProgressPayment.hakedisNo.split('-')[2])
        : 0;
        
      // Frontend'in beklediği formatta yanıt döndür
      const response = {
        id: newProgressPayment.id,
        projectId: newProgressPayment.projeId,
        projectName: newProgressPayment.proje?.name || "",
        paymentNumber: paymentNumber,
        description: newProgressPayment.aciklama || "",
        requestedAmount: newProgressPayment.tutar,
        approvedAmount: null as number | null,
        paidAmount: null as number | null,
        status: 'DRAFT',
        createdAt: newProgressPayment.createdAt.toISOString(),
        dueDate: newProgressPayment.hakedisTarihi.toISOString(),
        paymentDate: null as string | null,
        notes: null as string | null,
        documents: uploadedDocuments
      };

      return res.status(201).json({
        data: response
      });
    } catch (dbError: any) {
      console.error('Veritabanı hatası:', dbError);
      return res.status(500).json({ 
        message: 'Hakediş kaydedilirken veritabanı hatası oluştu', 
        error: dbError.message 
      });
    }
  } catch (error: any) {
    console.error('Hakediş oluşturma hatası:', error);
    return res.status(500).json({ 
      message: 'Hakediş oluşturulurken bir sunucu hatası oluştu',
      error: error.message
    });
  }
};

export const updateProgressPayment = async (req: Request, res: Response) => { 
  try {
    const { id } = req.params;
    const { 
      hakedisNo, 
      projeId, 
      aciklama, 
      hakedisTarihi,
      baslangicTarihi,
      bitisTarihi,
      tutar,
      kdvOrani,
      paraBirimi,
      durum
    } = req.body;

    // KDV ve toplam tutarı hesapla
    const kdvTutar = tutar * kdvOrani;
    const toplamTutar = tutar + kdvTutar;

    const updatedProgressPayment = await prisma.hakedis.update({
      where: { id },
      data: {
        hakedisNo,
        projeId,
        aciklama,
        hakedisTarihi: new Date(hakedisTarihi),
        baslangicTarihi: new Date(baslangicTarihi),
        bitisTarihi: new Date(bitisTarihi),
        tutar,
        kdvOrani,
        kdvTutar,
        toplamTutar,
        paraBirimi,
        durum
      }
    });

    return res.status(200).json(updatedProgressPayment);
  } catch (error) {
    console.error('Hakediş güncelleme hatası:', error);
    return res.status(500).json({ message: 'Hakediş güncellenirken bir sunucu hatası oluştu.' });
  }
 };

export const deleteProgressPayment = async (req: Request, res: Response) => { 
  try {
    const { id } = req.params;

    await prisma.hakedis.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Hakediş başarıyla silindi.' });
  } catch (error) {
    console.error('Hakediş silme hatası:', error);
    return res.status(500).json({ message: 'Hakediş silinirken bir sunucu hatası oluştu.' });
  }
 };

export const updateProgressPaymentStatus = async (req: Request, res: Response) => { 
  try {
    const { id } = req.params;
    const { durum, onaylayanId } = req.body;

    const updatedData: any = {
      durum
    };

    // Durum değişikliğine göre ek verileri güncelle
    if (durum === 'ONAYLANDI') {
      updatedData.onaylayanId = onaylayanId;
      updatedData.onayTarihi = new Date();
    } else if (durum === 'ODENDI') {
      updatedData.odemeTarihi = new Date();
      updatedData.odemeKanali = req.body.odemeKanali;
      updatedData.odemeReferansNo = req.body.odemeReferansNo;
    }

    const updatedProgressPayment = await prisma.hakedis.update({
      where: { id },
      data: updatedData
    });

    return res.status(200).json(updatedProgressPayment);
  } catch (error) {
    console.error('Hakediş durumu güncelleme hatası:', error);
    return res.status(500).json({ message: 'Hakediş durumu güncellenirken bir sunucu hatası oluştu.' });
  }
 };

export const getProjectFinancialSummary = async (req: Request, res: Response) => { 
  try {
    const { projectId } = req.params;

    const projectDetails = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        budget: true,
        hakedisler: {
          select: {
            id: true,
            hakedisNo: true,
            durum: true,
            tutar: true,
            kdvTutar: true,
            toplamTutar: true,
            hakedisTarihi: true
          }
        }
      }
    });

    if (!projectDetails) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }

    // Finansal özet hesapla
    const approvedPayments = projectDetails.hakedisler.filter(h => 
      h.durum === 'ONAYLANDI' || h.durum === 'ODENDI'
    );
    
    const totalApproved = approvedPayments.reduce((sum, h) => sum + h.toplamTutar, 0);
    const remainingBudget = projectDetails.budget ? projectDetails.budget - totalApproved : null;
    const totalPaid = projectDetails.hakedisler
      .filter(h => h.durum === 'ODENDI')
      .reduce((sum, h) => sum + h.toplamTutar, 0);

    return res.status(200).json({
      data: {
        projectId: projectDetails.id,
        projectName: projectDetails.name,
        totalBudget: projectDetails.budget,
        totalApproved,
        totalPaid,
        remainingBudget,
        paymentCount: projectDetails.hakedisler.length,
        approvedPaymentCount: approvedPayments.length,
        paidPaymentCount: projectDetails.hakedisler.filter(h => h.durum === 'ODENDI').length
      }
    });
  } catch (error) {
    console.error('Proje finansal özeti getirme hatası:', error);
    return res.status(500).json({ message: 'Proje finansal özeti alınırken bir sunucu hatası oluştu.' });
  }
 };