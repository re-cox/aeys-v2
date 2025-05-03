import { Request, Response } from 'express';
import { prisma } from '../lib/prisma'; // Orijinal import'a geri dön
// import { PrismaClient } from '@prisma/client'; // Bu satırları kaldır
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Doğrudan başlatmayı kaldır
/*
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
*/

// Tüm teknisyen raporlarını listele
export const getTeknisyenRaporlari = async (req: Request, res: Response) => {
  try {
    const { userId, projeId, siteId, durum } = req.query;
    
    let filter: any = {};
    
    if (userId) filter.teknisyenId = userId as string;
    if (projeId) filter.projeId = projeId as string;
    if (siteId) filter.siteId = siteId as string;
    if (durum) filter.durum = durum as string;
    
    const raporlar = await prisma.teknisyenRapor.findMany({
      where: filter,
      include: {
        teknisyen: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        },
        proje: {
          select: {
            id: true,
            name: true
          }
        },
        site: {
          select: {
            id: true,
            name: true
          }
        },
        dokumanlar: {
          select: {
            id: true,
            dosyaAdi: true,
            dosyaUrl: true,
            dosyaTipu: true,
            dosyaBoyutu: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        tarih: 'desc'
      }
    });
    
    return res.status(200).json(raporlar);
  } catch (error) {
    console.error('Teknisyen raporlarını getirme hatası:', error);
    return res.status(500).json({ message: 'Teknisyen raporları alınırken bir hata oluştu' });
  }
};

// Belirli bir teknisyen raporunu getir
export const getTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const rapor = await prisma.teknisyenRapor.findUnique({
      where: { id },
      include: {
        teknisyen: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        },
        proje: {
          select: {
            id: true,
            name: true
          }
        },
        site: {
          select: {
            id: true,
            name: true
          }
        },
        dokumanlar: {
          select: {
            id: true,
            dosyaAdi: true,
            dosyaUrl: true,
            dosyaTipu: true,
            dosyaBoyutu: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!rapor) {
      return res.status(404).json({ message: 'Teknisyen raporu bulunamadı' });
    }
    
    return res.status(200).json(rapor);
  } catch (error) {
    console.error('Teknisyen raporu getirme hatası:', error);
    return res.status(500).json({ message: 'Teknisyen raporu alınırken bir hata oluştu' });
  }
};

// Yeni teknisyen raporu oluştur
export const createTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { baslik, aciklama, durum, teknisyenId, projeId, siteId } = req.body;
    
    if (!baslik || !teknisyenId) {
      return res.status(400).json({ message: 'Başlık ve teknisyen bilgileri gereklidir' });
    }
    
    const yeniRapor = await prisma.teknisyenRapor.create({
      data: {
        baslik,
        aciklama,
        durum: durum || 'TASLAK',
        teknisyenId,
        projeId,
        siteId
      },
      include: {
        teknisyen: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        }
      }
    });
    
    return res.status(201).json(yeniRapor);
  } catch (error) {
    console.error('Teknisyen raporu oluşturma hatası:', error);
    return res.status(500).json({ message: 'Teknisyen raporu oluşturulurken bir hata oluştu' });
  }
};

// Teknisyen raporunu güncelle
export const updateTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { baslik, aciklama, durum, projeId, siteId } = req.body;
    
    const raporVarMi = await prisma.teknisyenRapor.findUnique({
      where: { id }
    });
    
    if (!raporVarMi) {
      return res.status(404).json({ message: 'Güncellenecek teknisyen raporu bulunamadı' });
    }
    
    const guncelRapor = await prisma.teknisyenRapor.update({
      where: { id },
      data: {
        baslik,
        aciklama,
        durum,
        projeId,
        siteId,
        updatedAt: new Date()
      },
      include: {
        teknisyen: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        },
        dokumanlar: true
      }
    });
    
    return res.status(200).json(guncelRapor);
  } catch (error) {
    console.error('Teknisyen raporu güncelleme hatası:', error);
    return res.status(500).json({ message: 'Teknisyen raporu güncellenirken bir hata oluştu' });
  }
};

// Teknisyen raporunu sil
export const deleteTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const raporVarMi = await prisma.teknisyenRapor.findUnique({
      where: { id },
      include: { dokumanlar: true }
    });
    
    if (!raporVarMi) {
      return res.status(404).json({ message: 'Silinecek teknisyen raporu bulunamadı' });
    }
    
    // Önce dokumanları sil
    for (const dokuman of raporVarMi.dokumanlar) {
      try {
        // Dosya sisteminden dosyayı sil
        const filePath = path.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar', path.basename(dokuman.dosyaUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error('Dosya silme hatası:', fileError);
      }
    }
    
    // Raporu ve ilişkili dokumanları sil (cascade delete ile)
    await prisma.teknisyenRapor.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Teknisyen raporu başarıyla silindi' });
  } catch (error) {
    console.error('Teknisyen raporu silme hatası:', error);
    return res.status(500).json({ message: 'Teknisyen raporu silinirken bir hata oluştu' });
  }
};

// Personel listesini getir (teknisyen seçimi için)
export const getPersoneller = async (req: Request, res: Response) => {
  try {
    const personeller = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        // Departman ilişkisi User modelinde değil, Employee modelinde.
        // department: {
        //   select: {
        //     id: true,
        //     name: true
        //   }
        // }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.status(200).json(personeller);
  } catch (error) {
    console.error('Personelleri getirme hatası:', error);
    return res.status(500).json({ message: 'Personeller alınırken bir hata oluştu' });
  }
};

// Teknisyen raporu için doküman yükle
export const uploadTeknisyenDokuman = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir dosya yükleyin' });
    }
    
    const { raporId, yuklayanId } = req.body;
    
    if (!raporId || !yuklayanId) {
      return res.status(400).json({ message: 'Rapor ID ve yükleyen ID gereklidir' });
    }
    
    // Rapor mevcut mu kontrol et
    const rapor = await prisma.teknisyenRapor.findUnique({
      where: { id: raporId }
    });
    
    if (!rapor) {
      return res.status(404).json({ message: 'Rapor bulunamadı' });
    }
    
    const file = req.file;
    const uploadDir = path.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Benzersiz dosya adı oluştur
    const dosyaUzantisi = path.extname(file.originalname);
    const benzersizDosyaAdi = `${uuidv4()}${dosyaUzantisi}`;
    const dosyaYolu = path.join(uploadDir, benzersizDosyaAdi);
    
    // Dosyayı kaydet
    fs.writeFileSync(dosyaYolu, file.buffer);
    
    // Veritabanına kayıt ekle
    const yeniDokuman = await prisma.teknisyenDokuman.create({
      data: {
        dosyaAdi: file.originalname,
        dosyaTipu: file.mimetype,
        dosyaBoyutu: file.size,
        dosyaUrl: `/uploads/teknisyen-dokumanlar/${benzersizDosyaAdi}`,
        raporId,
        yuklayanId
      }
    });
    
    return res.status(201).json(yeniDokuman);
  } catch (error) {
    console.error('Doküman yükleme hatası:', error);
    return res.status(500).json({ message: 'Doküman yüklenirken bir hata oluştu' });
  }
};

// Teknisyen dokümanını sil
export const deleteTeknisyenDokuman = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const dokuman = await prisma.teknisyenDokuman.findUnique({
      where: { id }
    });
    
    if (!dokuman) {
      return res.status(404).json({ message: 'Doküman bulunamadı' });
    }
    
    // Dosya sisteminden dosyayı sil
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar', path.basename(dokuman.dosyaUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Dosya silme hatası:', fileError);
    }
    
    // Veritabanından dokümanı sil
    await prisma.teknisyenDokuman.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Doküman başarıyla silindi' });
  } catch (error) {
    console.error('Doküman silme hatası:', error);
    return res.status(500).json({ message: 'Doküman silinirken bir hata oluştu' });
  }
}; 