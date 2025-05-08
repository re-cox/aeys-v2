"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Tüm teklifleri getir
router.get('/', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Sayfalama ve filtreleme eklenmeli
        const proposals = yield prisma_1.prisma.proposal.findMany({
            include: {
                customer: { select: { id: true, name: true } }, // Müşteri adı yeterli olabilir
                project: { select: { id: true, name: true } } // Proje adı yeterli olabilir
            },
            orderBy: { createdAt: 'desc' } // En yeniden eskiye sırala
        });
        // TODO: Toplam sayıyı da alıp göndermek (sayfalama için)
        res.json(proposals);
    }
    catch (error) {
        console.error('[API Error] Teklifler getirilirken hata:', error);
        res.status(500).json({ error: 'Teklifler alınamadı' });
    }
}));
// Belirli bir teklifi ID ile getir
router.get('/:proposalId', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { proposalId } = req.params;
    try {
        const proposal = yield prisma_1.prisma.proposal.findUnique({
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
    }
    catch (error) {
        console.error(`[API Error] Teklif ${proposalId} getirilirken hata:`, error);
        res.status(500).json({ error: 'Teklif alınamadı' });
    }
}));
// Yeni bir teklif oluştur
router.post('/', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        // protect middleware zaten 401 döndürmeli ama yine de kontrol edelim
        return res.status(401).json({ error: 'Yetkisiz işlem' });
    }
    const { customerId, projectId, issueDate, validUntilDate, notes, items // [{ description: "...", quantity: 1, unitPrice: 100.0 }, ...]
     } = req.body;
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Müşteri ID ve en az bir teklif kalemi zorunludur.' });
    }
    try {
        // Teklif Numarası Oluşturma
        const today = new Date();
        const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        const countToday = yield prisma_1.prisma.proposal.count({ where: { proposalNo: { startsWith: datePart } } });
        const nextProposalNo = `${datePart}-${(countToday + 1).toString().padStart(3, '0')}`;
        // Toplam Tutarı Hesapla
        const totalAmount = items.reduce((sum, item) => {
            const itemQuantity = parseFloat(item.quantity) || 1;
            const itemUnitPrice = parseFloat(item.unitPrice) || 0;
            const itemTotal = itemQuantity * itemUnitPrice;
            return sum + itemTotal;
        }, 0);
        // Teklif ve kalemlerini tek işlemde oluştur (transaction)
        const newProposal = yield prisma_1.prisma.proposal.create({
            data: {
                proposalNo: nextProposalNo,
                customerId,
                projectId: projectId || null, // projectId opsiyonel
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                validUntilDate: validUntilDate ? new Date(validUntilDate) : null,
                totalAmount,
                notes,
                createdById: userId,
                status: client_1.ProposalStatus.DRAFT,
                items: {
                    create: items.map((item) => ({
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
    }
    catch (error) {
        console.error('[API Error] Teklif oluşturulurken hata:', error);
        // TODO: Daha detaylı hata yönetimi (örn: P2002 unique constraint)
        res.status(500).json({ error: 'Teklif oluşturulamadı' });
    }
}));
// Bir teklifi güncelle
router.put('/:proposalId', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { proposalId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const _b = req.body, { items } = _b, proposalUpdateData = __rest(_b, ["items"]); // items ayrı, diğer alanlar ayrı
    if (!userId) {
        return res.status(401).json({ error: 'Yetkisiz işlem' });
    }
    // Güncellenecek Proposal alanlarını hazırla
    const dataToUpdate = Object.assign({}, proposalUpdateData);
    if (dataToUpdate.issueDate)
        dataToUpdate.issueDate = new Date(dataToUpdate.issueDate);
    if (dataToUpdate.validUntilDate)
        dataToUpdate.validUntilDate = new Date(dataToUpdate.validUntilDate);
    if (dataToUpdate.projectId === '')
        dataToUpdate.projectId = null; // Boş string gelirse null yap
    // Durum kontrolü
    if (dataToUpdate.status && !Object.values(client_1.ProposalStatus).includes(dataToUpdate.status)) {
        return res.status(400).json({ error: 'Geçersiz teklif durumu.' });
    }
    try {
        // Tek bir transaction içinde hem Proposal güncelle hem de Items'ı yönet
        const transactionResult = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Proposal ana bilgilerini güncelle
            const updatedProposal = yield tx.proposal.update({
                where: { id: proposalId },
                data: dataToUpdate,
            });
            // 2. Eğer items gönderildiyse, mevcutları silip yenilerini ekle
            if (items && Array.isArray(items)) {
                yield tx.proposalItem.deleteMany({ where: { proposalId: proposalId } });
                const newItemsData = items.map((item) => ({
                    proposalId: proposalId,
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    totalPrice: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0)
                }));
                yield tx.proposalItem.createMany({ data: newItemsData });
                // 3. Ana Proposal'ın toplam tutarını yeniden hesapla ve güncelle
                const newTotalAmount = newItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
                yield tx.proposal.update({
                    where: { id: proposalId },
                    data: { totalAmount: newTotalAmount }
                });
            }
            else if (items === null) {
                // Eğer items null gönderildiyse, tüm kalemleri sil ve toplamı sıfırla
                yield tx.proposalItem.deleteMany({ where: { proposalId: proposalId } });
                yield tx.proposal.update({
                    where: { id: proposalId },
                    data: { totalAmount: 0 }
                });
            }
            // items gönderilmediyse (undefined), kalemler ve toplam tutar değişmez
            return updatedProposal; // Sadece güncellenen proposal ana bilgisini döndür
        }));
        // Başarılı güncelleme sonrası güncellenmiş teklifi tam detaylarıyla alıp döndür
        const finalProposal = yield prisma_1.prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { items: true, customer: true, project: true, createdBy: { select: { id: true, name: true } } }
        });
        res.json(finalProposal);
    }
    catch (error) {
        console.error(`[API Error] Teklif ${proposalId} güncellenirken hata:`, error);
        if (error.code === 'P2025') { // Prisma: Kayıt bulunamadı hatası
            return res.status(404).json({ error: 'Güncellenmek istenen teklif bulunamadı' });
        }
        res.status(500).json({ error: 'Teklif güncellenemedi' });
    }
}));
// Bir teklifi sil
router.delete('/:proposalId', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { proposalId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ error: 'Yetkisiz işlem' });
    }
    try {
        // İlişkili ProposalItem'lar onDelete: Cascade ile otomatik silinecek
        yield prisma_1.prisma.proposal.delete({
            where: { id: proposalId },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error(`[API Error] Teklif ${proposalId} silinirken hata:`, error);
        if (error.code === 'P2025') { // Prisma: Kayıt bulunamadı hatası
            return res.status(404).json({ error: 'Silinmek istenen teklif bulunamadı' });
        }
        res.status(500).json({ error: 'Teklif silinemedi' });
    }
}));
exports.default = router;
