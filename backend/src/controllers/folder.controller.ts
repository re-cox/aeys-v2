import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { errorLogger } from '../utils/errorLogger';

const prisma = new PrismaClient();

/**
 * Tüm klasörleri listele
 * GET /api/folders
 */
export const getAllFolders = async (req: Request, res: Response) => {
  try {
    const parentId = req.query.parentId as string | undefined;
    
    const where: any = {};
    if (parentId === 'root' || parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }
    
    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.status(200).json(folders);
  } catch (error) {
    errorLogger('Klasörler listelenirken hata', error);
    return res.status(500).json({ 
      error: 'Klasörler listelenirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Belirli bir klasörün detaylarını getir
 * GET /api/folders/:id
 */
export const getFolderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: {
            name: 'asc'
          }
        },
        documents: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Klasör bulunamadı' });
    }
    
    return res.status(200).json(folder);
  } catch (error) {
    errorLogger(`Klasör detayları getirilirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Klasör detayları getirilirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Kök klasör içeriğini getir
 * GET /api/folders/root/contents
 */
export const getRootContents = async (req: Request, res: Response) => {
  try {
    console.log('[Folder Controller] Kök klasör içeriği isteniyor');
    
    // Ana klasörleri getir (parentId null olanlar)
    const folders = await prisma.folder.findMany({
      where: { 
        parentId: null
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Hiçbir klasöre ait olmayan dokümanlar
    const documents = await prisma.document.findMany({
      where: { 
        folderId: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`[Folder Controller] Kök klasör içeriği: ${folders.length} klasör, ${documents.length} doküman`);
    
    return res.status(200).json({
      folders,
      documents
    });
  } catch (error) {
    errorLogger('Kök klasör içeriği getirilirken hata', error);
    return res.status(500).json({ 
      error: 'Kök klasör içeriği getirilirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Belirli bir klasörün içeriğini getir
 * GET /api/folders/:id/contents
 */
export const getFolderContents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[Folder Controller] Klasör içeriği isteniyor: ${id}`);
    
    // Klasörün varlığını kontrol et
    const folderExists = await prisma.folder.findUnique({
      where: { id }
    });
    
    if (!folderExists) {
      return res.status(404).json({ error: 'Klasör bulunamadı' });
    }
    
    // Alt klasörleri getir
    const folders = await prisma.folder.findMany({
      where: { 
        parentId: id
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Klasöre ait dokümanları getir
    const documents = await prisma.document.findMany({
      where: { 
        folderId: id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`[Folder Controller] Klasör içeriği: ${folders.length} klasör, ${documents.length} doküman`);
    
    return res.status(200).json({
      folders,
      documents
    });
  } catch (error) {
    errorLogger(`Klasör içeriği getirilirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Klasör içeriği getirilirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Yeni klasör oluştur
 * POST /api/folders
 */
export const createFolder = async (req: Request, res: Response) => {
  try {
    const { name, description, parentId } = req.body;
    
    // Basit doğrulama
    if (!name) {
      return res.status(400).json({ error: 'Klasör adı zorunludur' });
    }
    
    // Kullanıcı ID'sini al
    const createdById = req.user?.id;
    if (!createdById) {
      return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bilgileri eksik' });
    }
    
    // Klasörü oluştur
    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        parentId: parentId === 'root' ? null : parentId,
        createdById
      }
    });
    
    return res.status(201).json(folder);
  } catch (error) {
    errorLogger('Klasör oluşturulurken hata', error);
    return res.status(500).json({ 
      error: 'Klasör oluşturulurken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Klasörü güncelle
 * PUT /api/folders/:id
 */
export const updateFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = req.body;
    
    // Basit doğrulama
    if (!name) {
      return res.status(400).json({ error: 'Klasör adı zorunludur' });
    }
    
    // Klasör varlığını kontrol et
    const exists = await prisma.folder.findUnique({
      where: { id }
    });
    
    if (!exists) {
      return res.status(404).json({ error: 'Klasör bulunamadı' });
    }
    
    // Döngüsel ilişki kontrolü
    if (parentId && parentId !== 'root' && parentId !== null) {
      if (parentId === id) {
        return res.status(400).json({ error: 'Klasör kendisini içeremez' });
      }
      
      // Alt klasörlerin ebeveyn olarak ayarlanması kontrolü
      // UYARI: Büyük klasör ağaçlarında performans problemi olabilir
      const checkCycle = async (currentId: string, targetId: string): Promise<boolean> => {
        if (currentId === targetId) return true;
        
        const childFolders = await prisma.folder.findMany({
          where: { parentId: currentId },
          select: { id: true }
        });
        
        for (const child of childFolders) {
          if (await checkCycle(child.id, targetId)) return true;
        }
        
        return false;
      };
      
      if (await checkCycle(id, parentId)) {
        return res.status(400).json({ error: 'Döngüsel klasör ilişkisi oluşturulamaz' });
      }
    }
    
    // Klasörü güncelle
    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name,
        description,
        parentId: parentId === 'root' ? null : parentId
      }
    });
    
    return res.status(200).json(folder);
  } catch (error) {
    errorLogger(`Klasör güncellenirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Klasör güncellenirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * Klasörü sil
 * DELETE /api/folders/:id
 */
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Klasör varlığını kontrol et
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            documents: true
          }
        }
      }
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Klasör bulunamadı' });
    }
    
    // Alt klasör ve doküman kontrolü
    if (folder._count?.children > 0) {
      return res.status(400).json({ error: 'Alt klasörler içeren klasör silinemez. Önce alt klasörleri taşıyın veya silin.' });
    }
    
    if (folder._count?.documents > 0) {
      return res.status(400).json({ error: 'Doküman içeren klasör silinemez. Önce dokümanları taşıyın veya silin.' });
    }
    
    // Klasörü sil
    await prisma.folder.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Klasör başarıyla silindi' });
  } catch (error) {
    errorLogger(`Klasör silinirken hata (ID: ${req.params.id})`, error);
    return res.status(500).json({ 
      error: 'Klasör silinirken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 