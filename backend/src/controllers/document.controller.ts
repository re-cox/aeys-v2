import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { errorLogger } from '../utils/errorLogger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Tüm dokümanları listele
 * GET /api/documents
 */
export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    const { folderId, type, category, search } = req.query;
    
    // Filtreleme kriterleri oluştur
    const where: any = {};
    
    if (folderId === 'root' || folderId === 'null') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId as string;
    }
    
    if (type) {
      where.type = type as string;
    }
    
    if (category) {
      where.category = category as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const documents = await prisma.document.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json(documents);
  } catch (error) {
    errorLogger('Dokümanlar listelenirken hata', error);
    return res.status(500).json({ 
      error: 'Dokümanlar listelenirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Belirli bir dokümanın detaylarını getir
 * GET /api/documents/:id
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Doküman bulunamadı' });
    }
    
    return res.status(200).json(document);
  } catch (error) {
    errorLogger(`Doküman detayları getirilirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Doküman detayları getirilirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Yeni doküman oluştur
 * POST /api/documents
 */
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      fileUrl, 
      type, 
      size, 
      mimeType, 
      category, 
      folderId 
    } = req.body;
    
    // Basit doğrulama
    if (!name) {
      return res.status(400).json({ error: 'Doküman adı zorunludur' });
    }
    
    // Kullanıcı ID'sini al
    const createdById = req.user?.id;
    if (!createdById) {
      return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bilgileri eksik' });
    }
    
    // Dokümanı oluştur
    const document = await prisma.document.create({
      data: {
        name,
        description,
        fileUrl,
        type: type || 'file',
        size: size ? Number(size) : 0,
        mimeType,
        category,
        folderId: folderId === 'root' ? null : folderId,
        createdById
      }
    });
    
    return res.status(201).json(document);
  } catch (error) {
    errorLogger('Doküman oluşturulurken hata', error);
    return res.status(500).json({ 
      error: 'Doküman oluşturulurken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Dokümanı güncelle
 * PUT /api/documents/:id
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      type, 
      category, 
      folderId 
    } = req.body;
    
    // Doküman varlığını kontrol et
    const exists = await prisma.document.findUnique({
      where: { id }
    });
    
    if (!exists) {
      return res.status(404).json({ error: 'Doküman bulunamadı' });
    }
    
    // Dokümanı güncelle
    const document = await prisma.document.update({
      where: { id },
      data: {
        name,
        description,
        type,
        category,
        folderId: folderId === 'root' ? null : folderId
      }
    });
    
    return res.status(200).json(document);
  } catch (error) {
    errorLogger(`Doküman güncellenirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Doküman güncellenirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Dokümanı sil
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Doküman varlığını kontrol et
    const document = await prisma.document.findUnique({
      where: { id }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Doküman bulunamadı' });
    }
    
    // Fiziksel dosya varsa silmeye çalış (opsiyonel)
    if (document.fileUrl) {
      try {
        const filePath = path.join(process.cwd(), 'uploads', document.fileUrl.replace(/^\/uploads\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Dosya silindi: ${filePath}`);
        }
      } catch (fileError) {
        console.error('Dosya silinirken hata:', fileError);
        // Dosya silme hatası durumunda bile işleme devam edilebilir
      }
    }
    
    // Dokümanı sil
    await prisma.document.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Doküman başarıyla silindi' });
  } catch (error) {
    errorLogger(`Doküman silinirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Doküman silinirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Dokümanı indir
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Doküman bilgilerini getir
    const document = await prisma.document.findUnique({
      where: { id }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Doküman bulunamadı' });
    }
    
    if (!document.fileUrl) {
      return res.status(400).json({ error: 'Doküman için dosya bulunamadı' });
    }
    
    // Dosya yolunu oluştur
    const filePath = path.join(process.cwd(), 'uploads', document.fileUrl.replace(/^\/uploads\//, ''));
    
    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    // Content-disposition header ayarla
    const filename = document.name || path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    // MIME tipini ayarla
    if (document.mimeType) {
      res.setHeader('Content-Type', document.mimeType);
    }
    
    // Dosyayı stream olarak gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    errorLogger(`Doküman indirilirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Doküman indirilirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 