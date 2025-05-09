const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

/**
 * Tüm hakedişleri getir
 * @param {Object} req - Express request nesnesi 
 * @param {Object} res - Express response nesnesi
 */
const getAllProgressPayments = async (req, res) => {
  try {
    const { projectId } = req.query;
    
    // Sorgu parametrelerini hazırla
    const whereClause = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    // Hakedişleri getir
    const progressPayments = await prisma.progressPayment.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true
          }
        },
        documents: true
      },
      orderBy: {
        createdAt: 'desc'
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
    
    return res.status(200).json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Hakediş verileri alınırken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş verileri alınamadı',
      error: error.message
    });
  }
};

/**
 * Hakediş detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const getProgressPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hakediş detayını getir
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
      return res.status(404).json({
        success: false,
        message: 'Hakediş bulunamadı'
      });
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
    
    return res.status(200).json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş detayı alınırken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş detayı alınamadı',
      error: error.message
    });
  }
};

/**
 * Yeni hakediş oluştur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const createProgressPayment = async (req, res) => {
  try {
    const { projectId, description, requestedAmount, dueDate, notes } = req.body;
    
    // Validasyon
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Proje ID zorunludur'
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Açıklama zorunludur'
      });
    }
    
    if (!requestedAmount || isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir talep tutarı girilmelidir'
      });
    }
    
    // Proje kontrolü
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proje bulunamadı'
      });
    }
    
    // Son hakediş numarasını bul
    const lastPayment = await prisma.progressPayment.findFirst({
      where: { projectId },
      orderBy: { paymentNumber: 'desc' }
    });
    
    const nextPaymentNumber = lastPayment ? lastPayment.paymentNumber + 1 : 1;
    
    // Yeni hakediş oluştur
    const newPayment = await prisma.progressPayment.create({
      data: {
        projectId,
        paymentNumber: nextPaymentNumber,
        description,
        requestedAmount: parseFloat(requestedAmount),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: 'DRAFT', // Varsayılan durum: Hazırlanıyor
        createdById: req.user.id // Oturum açan kullanıcı
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });
    
    // API yanıtını formatla
    const formattedPayment = {
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
      paymentDate: null,
      documents: [],
      notes: newPayment.notes
    };
    
    return res.status(201).json({
      success: true,
      message: 'Hakediş başarıyla oluşturuldu',
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş oluşturulurken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Hakediş güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const updateProgressPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, requestedAmount, dueDate, notes } = req.body;
    
    // Hakediş kontrolü
    const existingPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Hakediş bulunamadı'
      });
    }
    
    // Sadece Hazırlanıyor durumundaki hakedişler güncellenebilir
    if (existingPayment.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Sadece Hazırlanıyor durumundaki hakedişler güncellenebilir'
      });
    }
    
    // Güncelleme verilerini hazırla
    const updateData = {};
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (requestedAmount !== undefined) {
      updateData.requestedAmount = parseFloat(requestedAmount);
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
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
    
    return res.status(200).json({
      success: true,
      message: 'Hakediş başarıyla güncellendi',
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş güncellenirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Hakediş durumunu güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const updateProgressPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedAmount, paidAmount, paymentDate, notes } = req.body;
    
    // Durum kontrolü
    if (!status) {
      return res.status(400).json({
        success: false, 
        message: 'Durum bilgisi gereklidir'
      });
    }
    
    // Hakediş kontrolü
    const existingPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Hakediş bulunamadı'
      });
    }
    
    // Güncellenecek alanları hazırla
    const updateData = {
      status
    };
    
    // Durum bazlı alan güncellemeleri
    if (['APPROVED', 'PAID'].includes(status)) {
      if (approvedAmount !== undefined) {
        updateData.approvedAmount = approvedAmount;
      }
    }
    
    if (['PAID'].includes(status)) {
      if (paidAmount !== undefined) {
        updateData.paidAmount = paidAmount;
      }
      
      if (paymentDate !== undefined) {
        updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Durum değişikliklerini kaydeden kullanıcıyı belirleme
    if (status === 'APPROVED') {
      updateData.approvedById = req.user.id;
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
    
    return res.status(200).json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Hakediş durumu güncellenirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş durumu güncellenemedi',
      error: error.message
    });
  }
};

/**
 * Hakediş sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const deleteProgressPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hakediş kontrolü
    const existingPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });
    
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Hakediş bulunamadı'
      });
    }
    
    // Hakediş kaydını sil
    await prisma.progressPayment.delete({
      where: { id }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Hakediş başarıyla silindi'
    });
  } catch (error) {
    console.error('Hakediş silinirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Hakediş silinemedi',
      error: error.message
    });
  }
};

/**
 * Hakediş için belge yükleme
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const uploadDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Express-fileupload kontrolü
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Yüklenecek dosya bulunamadı'
      });
    }

    // Hakediş kontrolü
    const progressPayment = await prisma.progressPayment.findUnique({
      where: { id }
    });

    if (!progressPayment) {
      return res.status(404).json({
        success: false,
        message: 'Hakediş bulunamadı'
      });
    }

    // Upload dizinini oluştur
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'hakedis');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Dosyaları kaydet
    const documents = [];
    const uploadedFiles = Array.isArray(req.files.files) 
      ? req.files.files 
      : [req.files.files];
    
    for (const file of uploadedFiles) {
      const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      // Dosyayı kaydet
      await file.mv(filePath);
      
      // Veritabanına kaydet
      const fileUrl = `/uploads/hakedis/${uniqueFilename}`;
      const document = await prisma.progressPaymentDocument.create({
        data: {
          progressPaymentId: id,
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadDate: new Date()
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

    return res.status(201).json({
      success: true,
      message: 'Belgeler başarıyla yüklendi',
      data: documents
    });
  } catch (error) {
    console.error('Belgeler yüklenirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Belgeler yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Hakediş belgesini sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const deleteDocument = async (req, res) => {
  try {
    const { progressPaymentId, documentId } = req.params;

    // Belgenin varlığını kontrol et
    const document = await prisma.progressPaymentDocument.findUnique({
      where: {
        id: documentId,
        progressPaymentId: progressPaymentId
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Belge bulunamadı'
      });
    }

    // Belgeyi sil
    await prisma.progressPaymentDocument.delete({
      where: {
        id: documentId
      }
    });

    // Fiziksel dosyayı silmek için opsiyonel
    // const filePath = path.join(__dirname, '..', '..', document.fileUrl);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }

    return res.status(200).json({
      success: true,
      message: 'Belge başarıyla silindi'
    });
  } catch (error) {
    console.error('Belge silinirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Belge silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Proje finansal özetini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const getProjectFinancialSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Proje kontrolü
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        contractAmount: true
      }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proje bulunamadı'
      });
    }
    
    // Projeye ait tüm hakedişleri getir
    const progressPayments = await prisma.progressPayment.findMany({
      where: { projectId }
    });
    
    // Finansal özeti hesapla
    const totalRequestedAmount = progressPayments.reduce((sum, payment) => sum + payment.requestedAmount, 0);
    
    const totalApprovedAmount = progressPayments.reduce((sum, payment) => {
      if (payment.approvedAmount !== null) {
        return sum + payment.approvedAmount;
      }
      return sum;
    }, 0);
    
    const totalPaidAmount = progressPayments.reduce((sum, payment) => {
      if (payment.paidAmount !== null) {
        return sum + payment.paidAmount;
      }
      return sum;
    }, 0);
    
    const remainingBalance = project.contractAmount - totalPaidAmount;
    const completionPercentage = project.contractAmount > 0 
      ? (totalPaidAmount / project.contractAmount) * 100 
      : 0;
    
    // API yanıtını formatla
    const financialSummary = {
      projectId: project.id,
      projectName: project.name,
      contractAmount: project.contractAmount,
      totalRequestedAmount,
      totalApprovedAmount,
      totalPaidAmount,
      remainingBalance,
      completionPercentage
    };
    
    return res.status(200).json({
      success: true,
      data: financialSummary
    });
  } catch (error) {
    console.error('Finansal özet alınırken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Finansal özet alınamadı',
      error: error.message
    });
  }
};

module.exports = {
  getAllProgressPayments,
  getProgressPaymentById,
  createProgressPayment,
  updateProgressPayment,
  updateProgressPaymentStatus,
  deleteProgressPayment,
  uploadDocuments,
  deleteDocument,
  getProjectFinancialSummary
}; 