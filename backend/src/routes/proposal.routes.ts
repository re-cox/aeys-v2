import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { protect } from '../middleware/auth.middleware';
import { ProposalStatus } from '@prisma/client';

const router = express.Router();

// Tüm teklifleri getir
router.get('/', protect, async (req: Request, res: Response) => {
    try {
        // TODO: Sayfalama ve filtreleme eklenmeli
        const proposals = await prisma.proposal.findMany({
            include: { 
                customer: { select: { id: true, name: true } }, // Müşteri adı yeterli olabilir
                project: { select: { id: true, name: true } } // Proje adı yeterli olabilir
            },
            orderBy: { createdAt: 'desc' } // En yeniden eskiye sırala
        });
        // TODO: Toplam sayıyı da alıp göndermek (sayfalama için)
        res.json(proposals);
    } catch (error) {
        console.error('[API Error] Teklifler getirilirken hata:', error);
        res.status(500).json({ error: 'Teklifler alınamadı' });
    }
});

// Belirli bir teklifi ID ile getir
router.get('/:proposalId', protect, async (req: Request, res: Response) => {
    const { proposalId } = req.params;
    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                customer: true, // Müşteri detayları
                project: true, // Proje detayları
                createdBy: { select: { id: true, name: true, email: true } },
                items: true // Teklif kalemleri
            }
        });
        
        if (!proposal) {
            return res.status(404).json({ error: 'Teklif bulunamadı' });
        }
        res.json(proposal);
    } catch (error) {
        console.error(`[API Error] Teklif ${proposalId} getirilirken hata:`, error);
        res.status(500).json({ error: 'Teklif alınamadı' });
    }
});

// Yeni bir teklif oluştur
router.post('/', protect, async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        // protect middleware zaten 401 döndürmeli ama yine de kontrol edelim
        return res.status(401).json({ error: 'Yetkisiz işlem' }); 
    }

    const { 
        customerId,
        projectId,
        issueDate,
        validUntilDate,
        notes,
        items // [{ description: "...", quantity: 1, unitPrice: 100.0 }, ...]
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Müşteri ID ve en az bir teklif kalemi zorunludur.' });
    }

    try {
        // Teklif Numarası Oluşturma
        const today = new Date();
        const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        const countToday = await prisma.proposal.count({ where: { proposalNo: { startsWith: datePart } } });
        const nextProposalNo = `${datePart}-${(countToday + 1).toString().padStart(3, '0')}`;
        
        // Toplam Tutarı Hesapla
        const totalAmount = items.reduce((sum, item) => {
            const itemQuantity = parseFloat(item.quantity) || 1;
            const itemUnitPrice = parseFloat(item.unitPrice) || 0;
            const itemTotal = itemQuantity * itemUnitPrice;
            return sum + itemTotal;
        }, 0);
        
        // Teklif ve kalemlerini tek işlemde oluştur (transaction)
        const newProposal = await prisma.proposal.create({
            data: {
                proposalNo: nextProposalNo,
                customerId,
                projectId: projectId || null, // projectId opsiyonel
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                validUntilDate: validUntilDate ? new Date(validUntilDate) : null,
                totalAmount,
                notes,
                createdById: userId,
                status: ProposalStatus.DRAFT,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: parseFloat(item.quantity) || 1,
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        // totalPrice'ı daima hesapla
                        totalPrice: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0) 
                    }))
                }
            },
            include: { items: true, customer: true } // Oluşturulan teklifi detaylarıyla döndür
        });
        
        res.status(201).json(newProposal);
    } catch (error) {
        console.error('[API Error] Teklif oluşturulurken hata:', error);
        // TODO: Daha detaylı hata yönetimi (örn: P2002 unique constraint)
        res.status(500).json({ error: 'Teklif oluşturulamadı' });
    }
});

// Bir teklifi güncelle
router.put('/:proposalId', protect, async (req: Request, res: Response) => {
    const { proposalId } = req.params;
    const userId = req.user?.id;
    const { items, ...proposalUpdateData } = req.body; // items ayrı, diğer alanlar ayrı

    if (!userId) {
        return res.status(401).json({ error: 'Yetkisiz işlem' });
    }

    // Güncellenecek Proposal alanlarını hazırla
    const dataToUpdate: any = { ...proposalUpdateData };
    if (dataToUpdate.issueDate) dataToUpdate.issueDate = new Date(dataToUpdate.issueDate);
    if (dataToUpdate.validUntilDate) dataToUpdate.validUntilDate = new Date(dataToUpdate.validUntilDate);
    if (dataToUpdate.projectId === '') dataToUpdate.projectId = null; // Boş string gelirse null yap

    // Durum kontrolü
    if (dataToUpdate.status && !Object.values(ProposalStatus).includes(dataToUpdate.status)) {
        return res.status(400).json({ error: 'Geçersiz teklif durumu.' });
    }

    try {
        // Tek bir transaction içinde hem Proposal güncelle hem de Items'ı yönet
        const transactionResult = await prisma.$transaction(async (tx) => {
            // 1. Proposal ana bilgilerini güncelle
            const updatedProposal = await tx.proposal.update({
                where: { id: proposalId },
                data: dataToUpdate,
            });

            // 2. Eğer items gönderildiyse, mevcutları silip yenilerini ekle
            if (items && Array.isArray(items)) {
                await tx.proposalItem.deleteMany({ where: { proposalId: proposalId } });
                
                const newItemsData = items.map((item: any) => ({
                    proposalId: proposalId,
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    totalPrice: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0)
                }));
                await tx.proposalItem.createMany({ data: newItemsData });
                
                // 3. Ana Proposal'ın toplam tutarını yeniden hesapla ve güncelle
                const newTotalAmount = newItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
                await tx.proposal.update({
                    where: { id: proposalId },
                    data: { totalAmount: newTotalAmount }
                });
            } else if (items === null) {
                 // Eğer items null gönderildiyse, tüm kalemleri sil ve toplamı sıfırla
                 await tx.proposalItem.deleteMany({ where: { proposalId: proposalId } });
                 await tx.proposal.update({
                    where: { id: proposalId },
                    data: { totalAmount: 0 }
                });
            }
            // items gönderilmediyse (undefined), kalemler ve toplam tutar değişmez

            return updatedProposal; // Sadece güncellenen proposal ana bilgisini döndür
        });
        
        // Başarılı güncelleme sonrası güncellenmiş teklifi tam detaylarıyla alıp döndür
        const finalProposal = await prisma.proposal.findUnique({
             where: { id: proposalId },
             include: { items: true, customer: true, project: true, createdBy: { select: { id: true, name: true }}} 
        });

        res.json(finalProposal);

    } catch (error: any) {
        console.error(`[API Error] Teklif ${proposalId} güncellenirken hata:`, error);
        if (error.code === 'P2025') { // Prisma: Kayıt bulunamadı hatası
             return res.status(404).json({ error: 'Güncellenmek istenen teklif bulunamadı' });
        }
        res.status(500).json({ error: 'Teklif güncellenemedi' });
    }
});

// Bir teklifi sil
router.delete('/:proposalId', protect, async (req: Request, res: Response) => {
    const { proposalId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Yetkisiz işlem' });
    }
    
    try {
        // İlişkili ProposalItem'lar onDelete: Cascade ile otomatik silinecek
        await prisma.proposal.delete({
            where: { id: proposalId },
        });
        res.status(204).send();
    } catch (error: any) {
        console.error(`[API Error] Teklif ${proposalId} silinirken hata:`, error);
        if (error.code === 'P2025') { // Prisma: Kayıt bulunamadı hatası
             return res.status(404).json({ error: 'Silinmek istenen teklif bulunamadı' });
        }
        res.status(500).json({ error: 'Teklif silinemedi' });
    }
});

export default router; 