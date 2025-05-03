import express, { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import fs from 'fs'; // Dosya sistemi işlemleri için (opsiyonel: hata durumunda dosyayı silmek için)
import path from 'path'; // Dosya yolları için

const prismaClient = new PrismaClient();

// Yardımcı fonksiyon: Dosya URL'sini oluşturma
const getFileUrl = (req: Request, filePath: string): string => {
    const relativePath = path.relative(path.join(__dirname, '../../uploads'), filePath);
    const webPath = relativePath.replace(/\\/g, '/'); // Windows için
    return `${req.protocol}://${req.get('host')}/uploads/${webPath}`;
}

/**
 * @description Bir personelin profil fotoğrafını yükler ve günceller.
 * @route POST /api/employees/:employeeId/profile-picture
 * @access Private
 * @param req Express Request (file içerir, params.employeeId)
 * @param res Express Response
 * @param next Express NextFunction
 */
export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
              success: false,
              message: 'Profil fotoğrafı dosyası bulunamadı.' 
            });
        }

        const employeeId = req.params.employeeId;
        const file = req.file;
        
        // Personel kontrolü - userId ile ara
        const employee = await prismaClient.employee.findUnique({
            where: { userId: employeeId },
            select: { id: true, profilePictureUrl: true }
        });

        if (!employee) {
            // Dosyayı sil
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (unlinkError) {
                console.error(`Dosya silinirken hata: ${file.path}`, unlinkError);
            }
            
            return res.status(404).json({ 
              success: false,
              message: 'Profil resmi yüklenecek personel bulunamadı (userId ile eşleşme yok)' 
            });
        }

        const profilePictureUrl = `/uploads/profile/${file.filename}`;

        // Eski profil resmini sil (varsa)
        if (employee.profilePictureUrl) {
            const oldFilePath = path.join(__dirname, '../../uploads', employee.profilePictureUrl);
            // Yeni dosyanın eski dosya ile aynı olup olmadığını kontrol et
            if (fs.existsSync(oldFilePath) && oldFilePath !== file.path) {
                try {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Eski profil resmi silindi: ${oldFilePath}`);
                } catch (unlinkError) {
                    console.error(`Eski profil resmi silinirken hata: ${oldFilePath}`, unlinkError);
                    // Silme hatası kritik değil, işleme devam et
                }
            }
        }

        // Güncellemeyi employee'nin kendi ID'si ile yap
        const updatedEmployee = await prismaClient.employee.update({
            where: { id: employee.id },
            data: { profilePictureUrl: profilePictureUrl },
            select: { profilePictureUrl: true }
        });
        
        return res.status(200).json({ 
          success: true,
          message: 'Profil fotoğrafı başarıyla yüklendi',
          employee: updatedEmployee 
        });
    } catch (error) {
        console.error('Profil fotoğrafı yükleme hatası:', error);
        
        // Hatayı middleware'e ilet
        return next(error);
    }
};

/**
 * @description Bir personele ait dökümanları yükler.
 * @route POST /api/employees/:employeeId/documents
 * @access Private
 * @param req Express Request (files içerir, params.employeeId)
 * @param res Express Response
 * @param next Express NextFunction
 */
export const uploadEmployeeDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
    try {
        const employeeId = req.params.employeeId;
        
        // Dosya kontrolü
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Yüklenecek döküman bulunamadı' 
            });
        }

        const files = req.files as Express.Multer.File[];
        
        // Personel kontrolü
        const employee = await prismaClient.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            // Dosyaları sil
            await Promise.all(files.map(async (file) => {
                try { 
                    if (file.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (e) { 
                    console.error(`Dosya silinemedi: ${file.path}`, e); 
                }
            }));
            
            return res.status(404).json({ 
              success: false,
              message: 'Dökümanların yükleneceği personel bulunamadı' 
            });
        }

        // Her dosya için veritabanı kaydı oluştur
        const documentCreatePromises = files.map(async (file) => {
            // Dosya yolunu düzgün bir şekilde oluştur
            const documentUrl = `/uploads/documents/${file.filename}`;
            
            return prismaClient.employeeDocument.create({
                data: {
                    employeeId: employeeId,
                    name: file.originalname,
                    url: documentUrl,
                    type: file.mimetype,
                    size: file.size,
                    uploadDate: new Date(),
                },
                select: {
                    id: true,
                    name: true,
                    url: true,
                    type: true,
                    size: true,
                    uploadDate: true
                }
            });
        });

        const createdDocuments = await Promise.all(documentCreatePromises);

        res.status(200).json({ 
          success: true,
          message: 'Belgeler başarıyla yüklendi',
          documents: createdDocuments 
        });
    } catch (error) {
        console.error('Döküman yükleme hatası:', error);
        
        // Hatayı middleware'e ilet ve daha detaylı işlenmesini sağla
        return next(error);
    }
};

// Tüm çalışanları getirme işlemi
export const getAllEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employees = await prismaClient.employee.findMany({
      include: {
        department: true,
        documents: true
      }
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Çalışanlar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışanlar listelenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Tek bir çalışanı ID'ye göre getirme işlemi
export const getEmployeeById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    const employee = await prismaClient.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        documents: true
      }
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Çalışan bilgisi alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışan bilgisi alınırken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Yeni çalışan oluşturma işlemi
export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeData = req.body;
    
    const newEmployee = await prismaClient.employee.create({
      data: employeeData,
      include: {
        department: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Çalışan başarıyla oluşturuldu',
      data: newEmployee
    });
  } catch (error) {
    console.error('Çalışan oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışan oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Çalışan bilgilerini güncelleme işlemi
export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const employeeData = req.body;
    
    const updatedEmployee = await prismaClient.employee.update({
      where: { id: employeeId },
      data: employeeData,
      include: {
        department: true,
        documents: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Çalışan bilgileri başarıyla güncellendi',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Çalışan güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışan güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Çalışan silme işlemi
export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    // Önce çalışana ait dökümanları silme
    await prismaClient.employeeDocument.deleteMany({
      where: { employeeId: employeeId }
    });
    
    // Çalışanı silme
    await prismaClient.employee.delete({
      where: { id: employeeId }
    });

    res.status(200).json({
      success: true,
      message: 'Çalışan başarıyla silindi'
    });
  } catch (error) {
    console.error('Çalışan silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışan silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// TODO: Diğer Employee işlemleri (GET by ID, PUT, DELETE) buraya eklenebilir. 