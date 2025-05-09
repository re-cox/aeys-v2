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
      let paymentNumber = 0;
      try {
        // HK-2024-001 formatından yalnızca sayısal kısmı al
        const parts = hakedis.hakedisNo.split('-');
        if (parts.length >= 3) {
          paymentNumber = parseInt(parts[2]);
        } else {
          // Eğer format uygun değilse, hakedisNo'nun kendisini göster
          paymentNumber = parseInt(hakedis.hakedisNo) || 0;
        }
      } catch (err) {
        console.error(`Hakediş numarası ayrıştırma hatası: ${hakedis.hakedisNo}`, err);
        paymentNumber = 0;
      }

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
        projectName: hakedis.proje?.name || "", // Güvenli erişim
        paymentNumber: paymentNumber,
        description: hakedis.aciklama || "",
        createdAt: hakedis.createdAt ? new Date(hakedis.createdAt).toISOString() : null, // Null kontrolü eklendi
        dueDate: hakedis.hakedisTarihi ? new Date(hakedis.hakedisTarihi).toISOString() : null, // Null kontrolü eklendi
        requestedAmount: hakedis.tutar,
        approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        status: statusMap[hakedis.durum] || 'DRAFT',
        paymentDate: hakedis.odemeTarihi ? new Date(hakedis.odemeTarihi).toISOString() : null,
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
    console.log(`[getProgressPaymentById] ID ile hakediş bilgisi alınıyor: ${req.params.id}`);
    const { id } = req.params;
    
    // ID kontrolü
    if (!id) {
      console.log(`[getProgressPaymentById] Geçersiz ID: ${id}`);
      return res.status(400).json({ message: 'Geçersiz hakediş ID\'si.' });
    }
    
    try {
      // Önce ana hakediş verilerini al
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
          }
        },
      });

      console.log(`[getProgressPaymentById] Hakediş verisi bulundu mu: ${!!hakedis}`);
      
      if (!hakedis) {
        return res.status(404).json({ message: 'Hakediş bulunamadı.' });
      }
      
      // Şimdi hakediş belgelerini ayrı sorgu ile getir
      console.log(`[getProgressPaymentById] Hakediş belgeleri getiriliyor (hakedisId=${id})`);
      const hakedisDocuments = await prisma.hakedisDocument.findMany({
        where: {
          hakedisId: id
        }
      });
      
      console.log(`[getProgressPaymentById] ${hakedisDocuments.length} adet belge bulundu`);
      
      // Frontend'in beklediği formata dönüştür
      // Hakediş numarasından sayısal kısmı çıkar
      let paymentNumber = 0;
      try {
        // HK-2024-001 formatından yalnızca sayısal kısmı al
        const parts = hakedis.hakedisNo.split('-');
        if (parts.length >= 3) {
          paymentNumber = parseInt(parts[2]);
        } else {
          // Eğer format uygun değilse, hakedisNo'nun kendisini göster
          paymentNumber = parseInt(hakedis.hakedisNo) || 0;
        }
      } catch (err) {
        console.error(`Hakediş numarası ayrıştırma hatası: ${hakedis.hakedisNo}`, err);
        paymentNumber = 0;
      }

      // Durumu map'le
      const statusMap: { [key: string]: string } = {
        'TASLAK': 'DRAFT',
        'ONAY_BEKLIYOR': 'PENDING',
        'ONAYLANDI': 'APPROVED',
        'ODENDI': 'PAID',
        'REDDEDILDI': 'REJECTED',
        'IPTAL_EDILDI': 'REJECTED'
      };

      // Döküman bilgilerini formatla
      const documents = hakedisDocuments.map(doc => ({
        id: doc.id,
        fileName: doc.originalName || doc.fileName,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : null
      }));

      console.log(`[getProgressPaymentById] ${documents.length} adet belge formatlandı`);

      const progressPayment = {
        id: hakedis.id,
        projectId: hakedis.projeId,
        projectName: hakedis.proje?.name || "", 
        paymentNumber: paymentNumber,
        description: hakedis.aciklama || "",
        createdAt: hakedis.createdAt ? new Date(hakedis.createdAt).toISOString() : null,
        dueDate: hakedis.hakedisTarihi ? new Date(hakedis.hakedisTarihi).toISOString() : null,
        requestedAmount: hakedis.tutar,
        approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
        status: statusMap[hakedis.durum] || 'DRAFT',
        paymentDate: hakedis.odemeTarihi ? new Date(hakedis.odemeTarihi).toISOString() : null,
        notes: hakedis.aciklama || null,
        documents: documents
      };

      console.log(`[getProgressPaymentById] Hakediş bilgisi formatlandı, response gönderiliyor`);
      return res.status(200).json({
        data: progressPayment
      });
    } catch (dbError: any) {
      console.error('[getProgressPaymentById] Veritabanı sorgusunda hata:', dbError);
      return res.status(500).json({ message: 'Veritabanı sorgusunda bir hata oluştu.', error: dbError.message });
    }
  } catch (error: any) {
    console.error('Hakediş getirme hatası:', error);
    return res.status(500).json({ message: 'Hakediş alınırken bir sunucu hatası oluştu.', error: error.message });
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
    const uploadedDocuments: Array<any> = [];
    
    // Dosya yükleme işlemleri
    let uploadedFiles: Array<{
      fileName: string,
      originalName: string,
      fileUrl: string,
      fileType: string,
      fileSize: number
    }> = [];
    
    if (req.files && Object.keys(req.files).length > 0) {
      console.log('Dosya yükleme işlemi başlatılıyor...');
      
      // files bir dizi veya obje olabilir
      const uploadedFile = req.files.files as UploadedFile | UploadedFile[];
      const files = Array.isArray(uploadedFile) ? uploadedFile : [uploadedFile];
      
      // Yüklenecek dizin oluştur
      const uploadDir = path.join(__dirname, '../../uploads/hakedis');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (const file of files) {
        if (file) {
          const uniqueFilename = `${Date.now()}-${file.name}`;
          const filePath = path.join(uploadDir, uniqueFilename);
          
          // Dosyayı taşı
          await file.mv(filePath);
          
          // Döküman bilgisini kaydet
          uploadedFiles.push({
            fileName: file.name,
            originalName: file.name,
            fileUrl: `/uploads/hakedis/${uniqueFilename}`,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      }
      
      console.log('Yüklenen dosyalar:', uploadedFiles);
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
      
      // Prisma transaction ile hem hakediş hem de dökümanları kaydedelim
      const result = await prisma.$transaction(async (tx) => {
        // Önce hakediş kaydı oluştur
        const newProgressPayment = await tx.hakedis.create({
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
        
        // Eğer yüklenen dosyalar varsa, bunları veritabanına kaydet
        const documents = [];
        
        for (const file of uploadedFiles) {
          const document = await tx.hakedisDocument.create({
            data: {
              hakedisId: newProgressPayment.id,
              fileName: file.fileName,
              originalName: file.originalName,
              fileUrl: file.fileUrl,
              fileType: file.fileType,
              fileSize: file.fileSize,
              uploadedById: olusturanId
            }
          });
          
          documents.push({
            id: document.id,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            fileType: document.fileType,
            fileSize: document.fileSize,
            uploadDate: document.uploadDate.toISOString()
          });
        }
        
        return { newProgressPayment, documents };
      });
      
      const { newProgressPayment, documents } = result;
      
      // Hakediş numarasından sayısal kısmı çıkar
      let paymentNumber = 0;
      try {
        // HK-2024-001 formatından yalnızca sayısal kısmı al
        const parts = newProgressPayment.hakedisNo.split('-');
        if (parts.length >= 3) {
          paymentNumber = parseInt(parts[2]);
        } else {
          // Eğer format uygun değilse, hakedisNo'nun kendisini göster
          paymentNumber = parseInt(newProgressPayment.hakedisNo) || 0;
        }
      } catch (err) {
        console.error(`Hakediş numarası ayrıştırma hatası: ${newProgressPayment.hakedisNo}`, err);
        paymentNumber = 0;
      }
        
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
        documents: documents
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
    
    // Hakediş kaydını kontrol et
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
      include: {
        documents: true
      }
    });
    
    if (!hakedis) {
      return res.status(404).json({ message: 'Hakediş bulunamadı.' });
    }
    
    // Sadece TASLAK veya REDDEDILDI durumundaki hakedişler silinebilir
    if (hakedis.durum !== 'TASLAK' && hakedis.durum !== 'REDDEDILDI' && hakedis.durum !== 'IPTAL_EDILDI') {
      return res.status(403).json({ 
        message: 'Sadece taslak, reddedilmiş veya iptal edilmiş hakedişler silinebilir.' 
      });
    }
    
    // Dökümanları işle - fiziksel dosyaları sil
    for (const doc of hakedis.documents) {
      try {
        // Dosya yolunu al (URL'den): /uploads/hakedis/1234567890-dosyaadi.pdf -> uploads/hakedis/1234567890-dosyaadi.pdf
        const filePath = path.join(__dirname, '../..', doc.fileUrl);
        
        // Dosyayı sil
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error(`Dosya silme hatası (${doc.fileName}):`, fileError);
        // Dosya silme hatası nedeniyle işlemi durdurmuyoruz
      }
    }
    
    // Hakediş kaydını sil (cascade ile belgeler de silinecek)
    await prisma.hakedis.delete({
      where: { id }
    });
    
    return res.status(200).json({ 
      message: 'Hakediş başarıyla silindi.' 
    });
  } catch (error) {
    console.error('Hakediş silme hatası:', error);
    return res.status(500).json({ message: 'Hakediş silinirken bir sunucu hatası oluştu.' });
  }
};

// Hakedişe ait bir dökümanı sil
export const deleteProgressPaymentDocument = async (req: Request, res: Response) => {
  try {
    const { id, documentId } = req.params;
    
    // Dökümanı kontrol et
    const document = await prisma.hakedisDocument.findUnique({
      where: { 
        id: documentId 
      },
      include: {
        hakedis: true
      }
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Döküman bulunamadı.' });
    }
    
    // Bu dökümanın belirtilen hakediş kaydına ait olduğunu doğrula
    if (document.hakedisId !== id) {
      return res.status(403).json({ 
        message: 'Bu döküman belirtilen hakediş kaydına ait değil.' 
      });
    }
    
    // Hakediş durumunu kontrol et
    if (document.hakedis.durum !== 'TASLAK' && document.hakedis.durum !== 'REDDEDILDI') {
      return res.status(403).json({ 
        message: 'Sadece taslak veya reddedilmiş hakedişlere ait dökümanlar silinebilir.' 
      });
    }
    
    // Dosyayı diskten sil
    try {
      // Dosya yolunu al (URL'den): /uploads/hakedis/1234567890-dosyaadi.pdf -> uploads/hakedis/1234567890-dosyaadi.pdf
      const filePath = path.join(__dirname, '../..', document.fileUrl);
      
      // Dosyayı sil
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error(`Dosya silme hatası (${document.fileName}):`, fileError);
      // Dosya silme hatası nedeniyle işlemi durdurmuyoruz
    }
    
    // Döküman kaydını veritabanından sil
    await prisma.hakedisDocument.delete({
      where: { 
        id: documentId 
      }
    });
    
    return res.status(200).json({ 
      message: 'Döküman başarıyla silindi.' 
    });
  } catch (error) {
    console.error('Döküman silme hatası:', error);
    return res.status(500).json({ message: 'Döküman silinirken bir sunucu hatası oluştu.' });
  }
};

export const updateProgressPaymentStatus = async (req: Request, res: Response) => { 
  try {
    const { id } = req.params;
    console.log(`[updateProgressPaymentStatus] Hakediş durumu güncelleme isteği alındı: ID=${id}`, req.body);
    
    if (!id) {
      return res.status(400).json({ message: 'Geçersiz hakediş ID\'si.' });
    }
    
    // Frontend'den gelen durum ve diğer bilgileri al
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Durum (status) bilgisi gereklidir.' });
    }
    
    // İngilizce durum kodlarını Türkçe durum kodlarına dönüştür
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'TASLAK',
      'SUBMITTED': 'GONDERILDI', // Gönderildi durumu
      'PENDING': 'ONAY_BEKLIYOR',
      'APPROVED': 'ONAYLANDI',
      'PAID': 'ODENDI',
      'PARTIALLY_PAID': 'KISMI_ODENDI', // Kısmi ödendi durumu
      'REJECTED': 'REDDEDILDI'
    };
    
    // İngilizce durum kodunu Türkçe'ye dönüştür
    const durum = statusMap[status];
    
    if (!durum) {
      return res.status(400).json({ 
        message: `Geçersiz durum değeri: ${status}. Geçerli değerler: ${Object.keys(statusMap).join(', ')}` 
      });
    }
    
    console.log(`[updateProgressPaymentStatus] Frontend durum: ${status} -> Veritabanı durumu: ${durum}`);
    
    // Önce hakediş kaydını kontrol et
    const existingHakedis = await prisma.hakedis.findUnique({
      where: { id }
    });
    
    if (!existingHakedis) {
      return res.status(404).json({ message: 'Hakediş bulunamadı.' });
    }
    
    // Veritabanı güncellemesi için gerekli verileri hazırla
    const updatedData: any = {
      durum,
      updatedAt: new Date()
    };

    // Durum değişikliğine göre ek verileri güncelle
    if (durum === 'ONAYLANDI') {
      updatedData.onayTarihi = new Date();
    } else if (durum === 'ODENDI' || durum === 'KISMI_ODENDI') {
      // Hem ödendi hem kısmi ödendi durumları için ödeme tarihi ata
      updatedData.odemeTarihi = new Date();
    }
    // GONDERILDI durumu için özel bir alan güncellemesi yapmıyoruz
    // çünkü Hakedis modelinde gondermeTarihi adında bir alan yok
    
    console.log(`[updateProgressPaymentStatus] Güncellenecek veriler:`, updatedData);

    try {
      // Basitleştirilmiş veritabanı güncellemesi
      const updatedProgressPayment = await prisma.hakedis.update({
        where: { id },
        data: updatedData,
        include: {
          proje: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      console.log(`[updateProgressPaymentStatus] Hakediş güncellendi: ID=${id}, Durum=${updatedProgressPayment.durum}`);

      // Frontend'e geri dönüş için Türkçe -> İngilizce durum dönüşümü
      const reverseStatusMap: { [key: string]: string } = {
        'TASLAK': 'DRAFT',
        'GONDERILDI': 'SUBMITTED',
        'ONAY_BEKLIYOR': 'PENDING',
        'ONAYLANDI': 'APPROVED',
        'ODENDI': 'PAID',
        'KISMI_ODENDI': 'PARTIALLY_PAID',
        'REDDEDILDI': 'REJECTED'
      };
      
      // Hakediş numarasını sayısal formata çevir
      const paymentNumber = parseInt(updatedProgressPayment.hakedisNo.split('-').pop() || '0', 10) || 0;
      
      // Frontend'in beklediği formatta yanıt hazırla
      const response = {
        data: {
          id: updatedProgressPayment.id,
          projectId: updatedProgressPayment.projeId,
          projectName: updatedProgressPayment.proje?.name || "",
          paymentNumber: paymentNumber,
          description: updatedProgressPayment.aciklama || "",
          createdAt: updatedProgressPayment.createdAt ? new Date(updatedProgressPayment.createdAt).toISOString() : null,
          dueDate: updatedProgressPayment.hakedisTarihi ? new Date(updatedProgressPayment.hakedisTarihi).toISOString() : null,
          requestedAmount: updatedProgressPayment.tutar,
          approvedAmount: durum === 'ONAYLANDI' || durum === 'ODENDI' || durum === 'KISMI_ODENDI' ? updatedProgressPayment.tutar : null,
          paidAmount: durum === 'ODENDI' ? updatedProgressPayment.tutar : (durum === 'KISMI_ODENDI' ? updatedProgressPayment.tutar * 0.5 : null),
          status: reverseStatusMap[updatedProgressPayment.durum] || 'DRAFT',
          paymentDate: updatedProgressPayment.odemeTarihi ? new Date(updatedProgressPayment.odemeTarihi).toISOString() : null,
          notes: updatedProgressPayment.aciklama || null,
          // Basitleştirilmiş yanıt için boş dizi
          documents: [] 
        }
      };
      
      console.log(`[updateProgressPaymentStatus] Dönen yanıt durumu: ${response.data.status}`);

      return res.status(200).json(response);
    } catch (dbError: any) {
      console.error('[updateProgressPaymentStatus] Veritabanı güncelleme hatası:', dbError);
      return res.status(500).json({ 
        message: 'Veritabanı güncelleme hatası: ' + dbError.message, 
        error: dbError.message 
      });
    }
  } catch (error: any) {
    console.error('[updateProgressPaymentStatus] Hakediş durumu güncelleme hatası:', error);
    return res.status(500).json({ 
      message: 'Hakediş durumu güncellenirken bir sunucu hatası oluştu.', 
      error: error.message 
    });
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