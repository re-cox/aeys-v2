import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

// Teknisyen raporu oluştur
export const createTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { baslik, aciklama, durum, teknisyenId, projeId, siteId, tarih } = req.body;
    
    console.log('Alınan istek verileri:', req.body);
    
    // Zorunlu alanları kontrol et
    if (!baslik) {
      return res.status(400).json({ message: 'Başlık alanı zorunludur' });
    }
    
    if (!teknisyenId) {
      return res.status(400).json({ message: 'Rapor Bilgi Numarası alanı zorunludur' });
    }
    
    let parsedTarih = new Date();
    if (tarih) {
      parsedTarih = new Date(tarih);
      if (isNaN(parsedTarih.getTime())) {
        return res.status(400).json({ message: 'Geçersiz tarih formatı' });
      }
    }
    
    // Durum kontrolü
    let normalizedDurum = durum;
    const validDurumlar = ['TASLAK', 'INCELENIYOR', 'ONAYLANDI', 'REDDEDILDI'];
    
    if (!validDurumlar.includes(durum)) {
      console.warn(`Geçersiz durum değeri: ${durum}, varsayılan "TASLAK" kullanılıyor`);
      normalizedDurum = 'TASLAK';
    }
    
    // Sabit bir sistem kullanıcısı ID'si değil, direkt teknisyenId alanını kullan
    // Açıklama alanını olduğu gibi koru - frontend tarafından gerekli bilgiler ekleniyor
    
    // Raporu oluştur
    const yeniRapor = await prisma.teknisyenRapor.create({
      data: {
        baslik,
        aciklama: aciklama || '',
        durum: normalizedDurum,
        teknisyenId: teknisyenId, // Doğrudan kullanıcının girdiği değer
        projeId: projeId || null,
        siteId: siteId || null,
        tarih: parsedTarih
      }
    });

    res.status(201).json(yeniRapor);
  } catch (err) {
    const error = err as any;
    console.error('Teknisyen raporu oluşturma hatası:', error);
    const errorMessage = error.message || 'Teknisyen raporu oluşturulurken hata oluştu';
    
    // Prisma spesifik hatalarını kontrol et
    if (error.code) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          message: 'Bu bilgilerle zaten bir rapor kayıtlı',
          code: error.code
        });
      }
      
      // Foreign key hatası (P2003) durumunda - veritabanında bulunmayan bir ID kullanıldığında
      if (error.code === 'P2003') {
        // Hata detaylarını ayıkla
        const fieldName = error.meta?.field_name;
        const errorTarget = error.meta?.target;
        console.error(`Foreign key hatası: ${fieldName} alanı için geçersiz değer: ${errorTarget}`);
        
        // Kullanıcının girdiği değerleri değişkenlerde saklayalım
        const originalTeknisyenId = teknisyenId;
        const originalAciklama = aciklama || '';
        
        // Sonra veritabanında var olan bir ID kullanarak tekrar deneyelim
        try {
          // Sisteme kayıtlı bir kullanıcı bul
          const defaultUser = await prisma.user.findFirst();
          
          if (!defaultUser) {
            return res.status(500).json({ 
              message: 'Sistem hatası: Varsayılan kullanıcı bulunamadı',
              code: 'DEFAULT_USER_NOT_FOUND'
            });
          }
          
          // Kullanıcının girdiği teknisyenId'yi açıklama alanına ekle
          const updatedAciklama = `Rapor Bilgi No: ${originalTeknisyenId}\n\n${originalAciklama}`;
          
          console.log(`Foreign key hatası, varsayılan kullanıcı ile yeniden deneniyor: ${defaultUser.id}`);
          console.log(`Kullanıcının girdiği ID açıklamaya eklendi: ${originalTeknisyenId}`);
          
          // Varsayılan kullanıcı ile raporu oluştur
          const yeniRapor = await prisma.teknisyenRapor.create({
            data: {
              baslik: baslik,
              aciklama: updatedAciklama,
              durum: normalizedDurum,
              teknisyenId: defaultUser.id, // Sistemdeki varolan bir kullanıcı
              projeId: projeId || null,
              siteId: siteId || null,
              tarih: parsedTarih
            }
          });
          
          return res.status(201).json(yeniRapor);
        } catch (retryError) {
          console.error('Teknisyen raporu oluşturma yeniden deneme hatası:', retryError);
          return res.status(500).json({ 
            message: 'Teknisyen raporu oluşturulurken hata oluştu (yeniden deneme)',
            code: 'RETRY_FAILED'
          });
        }
      }
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Teknisyen raporunu güncelle
export const updateTeknisyenRaporu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { baslik, aciklama, durum, projeId, siteId, tarih } = req.body;
    
    console.log('Güncelleme için alınan istek verileri:', req.body);
    
    const raporVarMi = await prisma.teknisyenRapor.findUnique({
      where: { id }
    });
    
    if (!raporVarMi) {
      return res.status(404).json({ message: 'Güncellenecek teknisyen raporu bulunamadı' });
    }
    
    // Güncellenecek verileri hazırla
    const updateData: any = {};
    if (baslik !== undefined) updateData.baslik = baslik;
    if (aciklama !== undefined) updateData.aciklama = aciklama;
    if (durum !== undefined) updateData.durum = durum;
    if (projeId !== undefined) updateData.projeId = projeId;
    if (siteId !== undefined) updateData.siteId = siteId;
    if (tarih !== undefined) updateData.tarih = new Date(tarih);
    
    // Her durumda updatedAt'i güncelle
    updateData.updatedAt = new Date();
    
    const guncelRapor = await prisma.teknisyenRapor.update({
      where: { id },
      data: updateData,
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