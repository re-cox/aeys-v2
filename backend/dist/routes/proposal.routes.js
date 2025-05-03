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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Tüm teklifleri getir (müşteri ve kalem bilgileriyle)
router.get('/', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search = '', customerId = '', status = '' } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        // Filtreleme koşulları
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { proposalNo: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (status) {
            where.status = status;
        }
        console.log("Proposal şemasını kontrol et:", Object.keys(prisma_1.prisma));
        // Test için boş bir veri döndür
        return res.json({
            proposals: [],
            total: 0
        });
    }
    catch (error) {
        console.error('Teklifleri getirme hatası (DETAY):', error);
        return res.status(500).json({ error: 'Teklifler alınamadı' });
    }
}));
// Belirli bir teklifi ID ile getir
router.get('/:id', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const proposal = yield prisma_1.prisma.proposal.findUnique({
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
    }
    catch (error) {
        console.error('Teklif detayı getirme hatası:', error);
        return res.status(500).json({ error: 'Teklif detayı alınamadı' });
    }
}));
// Yeni teklif oluştur
router.post('/', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const countToday = yield prisma_1.prisma.proposal.count({ where: { proposalNo: { startsWith: datePart } } });
        const proposalNo = `${datePart}-${(countToday + 1).toString().padStart(4, '0')}`;
        // Teklif oluştur
        const newProposal = yield prisma_1.prisma.proposal.create({
            data: {
                proposalNo,
                title,
                customerId,
                status: status || 'DRAFT',
                validUntil: validUntil ? new Date(validUntil) : null,
                items: {
                    create: items.map((item) => ({
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
    }
    catch (error) {
        console.error('Teklif oluşturma hatası:', error);
        return res.status(500).json({ error: 'Teklif oluşturulamadı' });
    }
}));
// Mevcut teklifi güncelle
router.put('/:id', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, customerId, status, validUntil, items } = req.body;
        // Önce mevcut teklifi kontrol et
        const existingProposal = yield prisma_1.prisma.proposal.findUnique({
            where: { id },
        });
        if (!existingProposal) {
            return res.status(404).json({ error: 'Güncellenmek istenen teklif bulunamadı' });
        }
        // Teklifi güncelle (items hariç)
        const updatedProposal = yield prisma_1.prisma.proposal.update({
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
            yield prisma_1.prisma.proposalItem.deleteMany({
                where: { proposalId: id },
            });
            // Yeni kalemleri ekle
            for (const item of items) {
                yield prisma_1.prisma.proposalItem.create({
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
        const finalProposal = yield prisma_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true } },
                items: true,
            },
        });
        return res.json(finalProposal);
    }
    catch (error) {
        console.error('Teklif güncelleme hatası:', error);
        return res.status(500).json({ error: 'Teklif güncellenemedi' });
    }
}));
// Teklifi sil
router.delete('/:id', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Önce teklif varlığını kontrol et
        const existingProposal = yield prisma_1.prisma.proposal.findUnique({
            where: { id },
        });
        if (!existingProposal) {
            return res.status(404).json({ error: 'Silinmek istenen teklif bulunamadı' });
        }
        // Teklif kalemlerini sil (cascade silme olmadığı durumda)
        yield prisma_1.prisma.proposalItem.deleteMany({
            where: { proposalId: id },
        });
        // Teklifi sil
        yield prisma_1.prisma.proposal.delete({
            where: { id },
        });
        return res.json({ message: 'Teklif başarıyla silindi' });
    }
    catch (error) {
        console.error('Teklif silme hatası:', error);
        return res.status(500).json({ error: 'Teklif silinemedi' });
    }
}));
exports.default = router;
