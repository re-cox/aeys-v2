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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Tüm pazarlama aktivitelerini getir
router.get('/', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[Backend Marketing] Tüm pazarlama aktiviteleri isteniyor...');
        // Query parametrelerini al
        const { type, status, employeeId, customerId, startDate, endDate, search } = req.query;
        // Filtre koşullarını oluştur
        const filters = {};
        if (type)
            filters.type = type;
        if (status)
            filters.status = status;
        if (employeeId)
            filters.employeeId = employeeId;
        if (customerId)
            filters.customerId = customerId;
        // Tarih aralığı filtresi
        if (startDate || endDate) {
            filters.activityDate = {};
            if (startDate)
                filters.activityDate.gte = new Date(startDate);
            if (endDate)
                filters.activityDate.lte = new Date(endDate);
        }
        // Metin araması için koşul
        if (search) {
            filters.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { outcome: { contains: search, mode: 'insensitive' } },
                { nextStep: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Doğrudan SQL sorgusu kullan
        const activities = yield prisma.$queryRaw `
      SELECT ma.*, c.name as customerName, e.position as employeePosition
      FROM "MarketingActivity" ma
      LEFT JOIN "Customer" c ON ma."customerId" = c.id
      LEFT JOIN "Employee" e ON ma."employeeId" = e.id
      ORDER BY ma."activityDate" DESC
    `;
        console.log(`[Backend Marketing] ${Array.isArray(activities) ? activities.length : 0} pazarlama aktivitesi bulundu.`);
        res.json(activities);
    }
    catch (error) {
        console.error('[Backend Marketing] Aktivite listeleme hatası:', error);
        res.status(500).json({ message: 'Pazarlama aktiviteleri getirilirken bir hata oluştu.' });
    }
}));
// ID'ye göre pazarlama aktivitesi getir
router.get('/:id', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[Backend Marketing] ID: ${id} olan aktivite isteniyor...`);
        // Doğrudan SQL sorgusu kullan
        const activities = yield prisma.$queryRaw `
      SELECT ma.*, c.name as customerName, e.position as employeePosition
      FROM "MarketingActivity" ma
      LEFT JOIN "Customer" c ON ma."customerId" = c.id
      LEFT JOIN "Employee" e ON ma."employeeId" = e.id
      WHERE ma.id = ${id}
    `;
        const activity = Array.isArray(activities) && activities.length > 0 ? activities[0] : null;
        if (!activity) {
            console.log(`[Backend Marketing] ID: ${id} olan aktivite bulunamadı.`);
            return res.status(404).json({ message: 'Pazarlama aktivitesi bulunamadı.' });
        }
        console.log(`[Backend Marketing] ID: ${id} olan aktivite bulundu.`);
        res.json(activity);
    }
    catch (error) {
        console.error('[Backend Marketing] Aktivite getirme hatası:', error);
        res.status(500).json({ message: 'Pazarlama aktivitesi getirilirken bir hata oluştu.' });
    }
}));
// Yeni pazarlama aktivitesi oluştur
router.post('/', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[Backend Marketing] Yeni aktivite oluşturma isteği');
        const data = req.body;
        // Zorunlu alanları kontrol et
        if (!data.type || !data.status || !data.activityDate || !data.customerId || !data.employeeId) {
            return res.status(400).json({ message: 'Tür, durum, aktivite tarihi, müşteri ID ve çalışan ID zorunludur.' });
        }
        // Doğrudan SQL sorgusu kullan
        const result = yield prisma.$executeRaw `
      INSERT INTO "MarketingActivity" (
        id, type, status, "activityDate", title, description, outcome, 
        "nextStep", "nextStepDate", "locationLink", "customerId", "employeeId", 
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 
        ${data.type}, 
        ${data.status}, 
        ${new Date(data.activityDate)}, 
        ${data.title || null}, 
        ${data.description || null}, 
        ${data.outcome || null}, 
        ${data.nextStep || null}, 
        ${data.nextStepDate ? new Date(data.nextStepDate) : null}, 
        ${data.locationLink || null}, 
        ${data.customerId}, 
        ${data.employeeId}, 
        NOW(), 
        NOW()
      ) RETURNING id
    `;
        // Yeni oluşturulan kaydı getir
        const newActivity = yield prisma.$queryRaw `
      SELECT ma.*, c.name as customerName, e.position as employeePosition
      FROM "MarketingActivity" ma
      LEFT JOIN "Customer" c ON ma."customerId" = c.id
      LEFT JOIN "Employee" e ON ma."employeeId" = e.id
      WHERE ma.id = (
        SELECT id FROM "MarketingActivity" 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      )
    `;
        console.log(`[Backend Marketing] Yeni aktivite oluşturuldu`);
        res.status(201).json(Array.isArray(newActivity) ? newActivity[0] : null);
    }
    catch (error) {
        console.error('[Backend Marketing] Aktivite oluşturma hatası:', error);
        res.status(500).json({ message: 'Pazarlama aktivitesi oluşturulurken bir hata oluştu.' });
    }
}));
// Pazarlama aktivitesi güncelle
router.put('/:id', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        console.log(`[Backend Marketing] ID: ${id} olan aktivite güncelleniyor...`);
        // Aktivitenin var olup olmadığını kontrol et
        const checkActivity = yield prisma.$queryRaw `
      SELECT id FROM "MarketingActivity" WHERE id = ${id}
    `;
        if (!Array.isArray(checkActivity) || checkActivity.length === 0) {
            return res.status(404).json({ message: 'Güncellenecek pazarlama aktivitesi bulunamadı.' });
        }
        // Aktiviteyi güncelle - SQL sorgusu
        yield prisma.$executeRaw `
      UPDATE "MarketingActivity"
      SET 
        type = ${data.type || null},
        status = ${data.status || null},
        "activityDate" = ${data.activityDate ? new Date(data.activityDate) : null},
        title = ${data.title || null},
        description = ${data.description || null},
        outcome = ${data.outcome || null},
        "nextStep" = ${data.nextStep || null},
        "nextStepDate" = ${data.nextStepDate ? new Date(data.nextStepDate) : null},
        "locationLink" = ${data.locationLink || null},
        "customerId" = ${data.customerId || null},
        "employeeId" = ${data.employeeId || null},
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;
        // Güncellenmiş aktiviteyi getir
        const updatedActivity = yield prisma.$queryRaw `
      SELECT ma.*, c.name as customerName, e.position as employeePosition
      FROM "MarketingActivity" ma
      LEFT JOIN "Customer" c ON ma."customerId" = c.id
      LEFT JOIN "Employee" e ON ma."employeeId" = e.id
      WHERE ma.id = ${id}
    `;
        console.log(`[Backend Marketing] ID: ${id} olan aktivite güncellendi.`);
        res.json(Array.isArray(updatedActivity) ? updatedActivity[0] : null);
    }
    catch (error) {
        console.error('[Backend Marketing] Aktivite güncelleme hatası:', error);
        res.status(500).json({ message: 'Pazarlama aktivitesi güncellenirken bir hata oluştu.' });
    }
}));
// Pazarlama aktivitesi sil
router.delete('/:id', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[Backend Marketing] ID: ${id} olan aktivite siliniyor...`);
        // Aktivitenin var olup olmadığını kontrol et
        const checkActivity = yield prisma.$queryRaw `
      SELECT id FROM "MarketingActivity" WHERE id = ${id}
    `;
        if (!Array.isArray(checkActivity) || checkActivity.length === 0) {
            return res.status(404).json({ message: 'Silinecek pazarlama aktivitesi bulunamadı.' });
        }
        // Aktiviteyi sil
        yield prisma.$executeRaw `
      DELETE FROM "MarketingActivity"
      WHERE id = ${id}
    `;
        console.log(`[Backend Marketing] ID: ${id} olan aktivite silindi.`);
        res.status(204).send();
    }
    catch (error) {
        console.error('[Backend Marketing] Aktivite silme hatası:', error);
        res.status(500).json({ message: 'Pazarlama aktivitesi silinirken bir hata oluştu.' });
    }
}));
exports.default = router;
