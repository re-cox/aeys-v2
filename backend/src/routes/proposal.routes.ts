import express from 'express';
import { prisma } from '../lib/prisma';
import { protect as authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

// Tüm teklifleri getir (müşteri ve kalem bilgileriyle)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = '1', limit = '10', search = '', customerId = '', status = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Filtreleme koşulları
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { proposalNo: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (customerId) {
      where.customerId = customerId as string;
    }
    
    if (status) {
      where.status = status as string;
    }
    
    console.log("Proposal şemasını kontrol et:", Object.keys(prisma));
    
    // Test için boş bir veri döndür
    return res.json({ 
      proposals: [], 
      total: 0 
    });
  } catch (error) {
    console.error('Teklifleri getirme hatası (DETAY):', error);
    return res.status(500).json({ error: 'Teklifler alınamadı' });
  }
});

// Belirli bir teklifi ID ile getir
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });
    
    if (!proposal) {
      return res.status(404).json({ error: 'Teklif bulunamadı' });
    }
    
    return res.json(proposal);
  } catch (error) {
    console.error('Teklif detayı getirme hatası:', error);
    return res.status(500).json({ error: 'Teklif detayı alınamadı' });
  }
});

// Yeni teklif oluştur
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, customerId, status, validUntil, items } = req.body;
    
    // Gerekli alan kontrolü
    if (!title || !customerId) {
      return res.status(400).json({ error: 'Teklif başlığı ve müşteri seçimi zorunludur' });
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Teklife en az bir kalem eklenmelidir' });
    }
    
    // Benzersiz Teklif Numarası Oluştur (Örnek: YYYYMMDD-XXXX)
    const today = new Date();
    const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const countToday = await prisma.proposal.count({ where: { proposalNo: { startsWith: datePart } } });
    const proposalNo = `${datePart}-${(countToday + 1).toString().padStart(4, '0')}`;
    
    // Teklif oluştur
    const newProposal = await prisma.proposal.create({
      data: {
        proposalNo,
        title,
        customerId,
        status: status || 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            description: item.description,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });
    
    return res.status(201).json(newProposal);
  } catch (error) {
    console.error('Teklif oluşturma hatası:', error);
    return res.status(500).json({ error: 'Teklif oluşturulamadı' });
  }
});

// Mevcut teklifi güncelle
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, customerId, status, validUntil, items } = req.body;
    
    // Önce mevcut teklifi kontrol et
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    });
    
    if (!existingProposal) {
      return res.status(404).json({ error: 'Güncellenmek istenen teklif bulunamadı' });
    }
    
    // Teklifi güncelle (items hariç)
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        title,
        customerId,
        status,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });
    
    // Eğer kalemler gönderildiyse, önce mevcut kalemleri sil, sonra yenilerini ekle
    if (Array.isArray(items) && items.length > 0) {
      // Mevcut kalemleri sil
      await prisma.proposalItem.deleteMany({
        where: { proposalId: id },
      });
      
      // Yeni kalemleri ekle
      for (const item of items) {
        await prisma.proposalItem.create({
          data: {
            proposalId: id,
            type: item.type,
            description: item.description,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          },
        });
      }
    }
    
    // Güncellenmiş teklifi tüm ilişkili verileriyle getir
    const finalProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });
    
    return res.json(finalProposal);
  } catch (error) {
    console.error('Teklif güncelleme hatası:', error);
    return res.status(500).json({ error: 'Teklif güncellenemedi' });
  }
});

// Teklifi sil
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Önce teklif varlığını kontrol et
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    });
    
    if (!existingProposal) {
      return res.status(404).json({ error: 'Silinmek istenen teklif bulunamadı' });
    }
    
    // Teklif kalemlerini sil (cascade silme olmadığı durumda)
    await prisma.proposalItem.deleteMany({
      where: { proposalId: id },
    });
    
    // Teklifi sil
    await prisma.proposal.delete({
      where: { id },
    });
    
    return res.json({ message: 'Teklif başarıyla silindi' });
  } catch (error) {
    console.error('Teklif silme hatası:', error);
    return res.status(500).json({ error: 'Teklif silinemedi' });
  }
});

export default router; 