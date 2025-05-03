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
exports.getAnnualLeaveStats = exports.updateAnnualLeave = exports.updateAnnualLeaveStatus = exports.createAnnualLeave = exports.getAnnualLeaves = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// GET istekleri için Zod şeması (opsiyonel filtreleme)
const getAnnualLeavesQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
    status: zod_1.z.nativeEnum(client_1.LeaveStatus).optional(), // Enum'a göre filtreleme
    year: zod_1.z.string().regex(/^\d{4}$/, "Geçersiz yıl formatı (YYYY)").optional(), // Yıla göre filtreleme (opsiyonel)
});
// POST istekleri için Zod şeması
const createLeaveBodySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Geçersiz kullanıcı ID formatı"),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)"),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)"),
    reason: zod_1.z.string().min(1, "İzin nedeni boş olamaz").optional(), // Sebep zorunlu olabilir, isteğe bağlı bırakıldı
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["endDate"],
});
// PUT (Update Status) istekleri için Zod şeması
const updateLeaveStatusBodySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.LeaveStatus, { errorMap: () => ({ message: "Geçersiz durum kodu" }) }),
    // Onaylayan kişi bilgisi (auth middleware'den alınabilir)
    // approvedById: z.string().uuid().optional(), 
});
// PUT (Update Leave Details) istekleri için Zod şeması
const updateLeaveBodySchema = zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)").optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)").optional(),
    reason: zod_1.z.string().min(1, "İzin nedeni boş olamaz").optional(),
}).refine(data => {
    // Eğer her iki tarih de varsa, bitiş başlangıçtan sonra olmalı
    if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true; // Sadece biri varsa veya hiçbiri yoksa kontrolü geç
}, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["endDate"],
});
// Helper fonksiyon: İş günlerini hesapla
const calculateBusinessDays = (start, end) => {
    let count = 0;
    const current = new Date(start.getTime());
    // Bitiş tarihini de dahil etmek için <= kullan
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pazar (0) ve Cumartesi (6) hariç
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};
/**
 * @description Belirtilen kriterlere göre yıllık izin kayıtlarını getirir.
 * @route GET /api/annual-leaves
 * @access Private (Yetkilendirme eklenecek)
 */
const getAnnualLeaves = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryParams = getAnnualLeavesQuerySchema.safeParse(req.query);
        if (!queryParams.success) {
            res.status(400).json({ message: "Geçersiz filtre parametreleri", errors: queryParams.error.format() });
            return;
        }
        const { userId, status, year } = queryParams.data;
        let whereClause = {};
        if (userId)
            whereClause.userId = userId;
        if (status)
            whereClause.status = status;
        if (year) {
            const yearStartDate = new Date(`${year}-01-01`);
            const yearEndDate = new Date(`${year}-12-31`);
            // Yıl içinde başlayan VEYA biten izinleri getir (veya sadece başlayanları)
            whereClause.OR = [
                { startDate: { gte: yearStartDate, lte: yearEndDate } },
                { endDate: { gte: yearStartDate, lte: yearEndDate } },
            ];
            // Sadece başlangıç tarihine göre:
            // whereClause.startDate = { gte: yearStartDate, lte: yearEndDate };
        }
        const annualLeaves = yield prisma.annualLeave.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        // Employee üzerinden departman bilgisi alınabilir, ancak bu sorguda gerekmeyebilir.
                    }
                },
                approvedBy: { select: { id: true, name: true, surname: true } }
            },
            orderBy: {
                requestedAt: 'desc',
            },
        });
        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeaves = annualLeaves.map(leave => {
            var _a, _b;
            return (Object.assign(Object.assign({}, leave), { startDate: leave.startDate.toISOString().split('T')[0], endDate: leave.endDate.toISOString().split('T')[0], requestedAt: leave.requestedAt.toISOString(), approvedAt: (_b = (_a = leave.approvedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null }));
        });
        res.status(200).json(formattedLeaves);
    }
    catch (error) {
        console.error("Yıllık izin getirme hatası:", error);
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.getAnnualLeaves = getAnnualLeaves;
/**
 * @description Yeni bir yıllık izin talebi oluşturur.
 * @route POST /api/annual-leaves
 * @access Private (Yetkilendirme eklenecek)
 */
const createAnnualLeave = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const validationResult = createLeaveBodySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz izin talep verisi", errors: validationResult.error.format() });
            return;
        }
        // TODO: Kullanıcının kalan izin günü kontrolü eklenebilir.
        const { userId, startDate, endDate, reason } = validationResult.data;
        const newLeave = yield prisma.annualLeave.create({
            data: {
                userId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: client_1.LeaveStatus.PENDING // Başlangıç durumu
            },
            include: { user: { select: { id: true, name: true, surname: true } } }
        });
        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = Object.assign(Object.assign({}, newLeave), { startDate: newLeave.startDate.toISOString().split('T')[0], endDate: newLeave.endDate.toISOString().split('T')[0], requestedAt: newLeave.requestedAt.toISOString(), approvedAt: (_b = (_a = newLeave.approvedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null });
        res.status(201).json(formattedLeave);
    }
    catch (error) {
        console.error("Yıllık izin oluşturma hatası:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: "Geçersiz Kullanıcı ID" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.createAnnualLeave = createAnnualLeave;
/**
 * @description Bir yıllık izin talebinin durumunu günceller (Onay/Red).
 * @route PUT /api/annual-leaves/:id/status
 * @access Private (Yetkilendirme eklenecek - Yönetici/Manager)
 */
const updateAnnualLeaveStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params; // URL'den izin ID'sini al
        const validationResult = updateLeaveStatusBodySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz durum verisi", errors: validationResult.error.format() });
            return;
        }
        const { status } = validationResult.data;
        // Middleware'den onaylayan kullanıcı ID'sini al (req.user'ın var olduğu varsayılır)
        // req üzerine user eklemek için Express tip genişletmesi gerekebilir
        const approverId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!approverId) {
            // Eğer approverId bulunamazsa (middleware çalışmadıysa veya user bilgisi yoksa) hata döndür
            return res.status(401).json({ message: "İşlemi yapan kullanıcı kimliği bulunamadı veya yetkilendirme başarısız." });
        }
        const updatedLeave = yield prisma.annualLeave.update({
            where: { id },
            data: {
                status,
                approvedById: approverId, // Onaylayan kişiyi set et
                approvedAt: new Date(), // Onay zamanını set et
            },
            include: {
                user: { select: { id: true, name: true, surname: true } },
                approvedBy: { select: { id: true, name: true, surname: true } }
            }
        });
        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = Object.assign(Object.assign({}, updatedLeave), { startDate: updatedLeave.startDate.toISOString().split('T')[0], endDate: updatedLeave.endDate.toISOString().split('T')[0], requestedAt: updatedLeave.requestedAt.toISOString(), approvedAt: (_c = (_b = updatedLeave.approvedAt) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : null });
        res.status(200).json(formattedLeave);
    }
    catch (error) {
        console.error("Yıllık izin durumu güncelleme hatası:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Kayıt bulunamadı
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.updateAnnualLeaveStatus = updateAnnualLeaveStatus;
/**
 * @description Mevcut bir yıllık izin talebinin detaylarını günceller.
 * Sadece 'PENDING' durumundaki izinler güncellenebilir (varsayım).
 * @route PUT /api/annual-leaves/:id
 * @access Private (Yetkilendirme eklenecek - İzin sahibi veya Yönetici)
 */
const updateAnnualLeave = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const validationResult = updateLeaveBodySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz güncelleme verisi", errors: validationResult.error.format() });
            return;
        }
        const updateData = {};
        const { startDate, endDate, reason } = validationResult.data;
        if (startDate)
            updateData.startDate = new Date(startDate);
        if (endDate)
            updateData.endDate = new Date(endDate);
        if (reason)
            updateData.reason = reason;
        // Eğer güncellenecek alan yoksa hata ver
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: "Güncellenecek alan belirtilmedi" });
            return;
        }
        // Opsiyonel: Sadece PENDING durumundaki izinlerin güncellenmesine izin ver
        const existingLeave = yield prisma.annualLeave.findUnique({
            where: { id }
        });
        if (!existingLeave) {
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }
        // TODO: Yetkilendirme kontrolü - Sadece izin sahibi veya yönetici güncelleyebilmeli
        // if (req.user.id !== existingLeave.userId && req.user.role !== 'admin') { ... }
        if (existingLeave.status !== client_1.LeaveStatus.PENDING) {
            res.status(403).json({ message: "Sadece bekleyen izin talepleri güncellenebilir" });
            return;
        }
        const updatedLeave = yield prisma.annualLeave.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, surname: true } },
                approvedBy: { select: { id: true, name: true, surname: true } }
            }
        });
        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = Object.assign(Object.assign({}, updatedLeave), { startDate: updatedLeave.startDate.toISOString().split('T')[0], endDate: updatedLeave.endDate.toISOString().split('T')[0], requestedAt: updatedLeave.requestedAt.toISOString(), approvedAt: (_b = (_a = updatedLeave.approvedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null });
        res.status(200).json(formattedLeave);
    }
    catch (error) {
        console.error("Yıllık izin güncelleme hatası:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Kayıt bulunamadı
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.updateAnnualLeave = updateAnnualLeave;
/**
 * @description Tüm çalışanların yıllık izin istatistiklerini hesaplar ve döndürür.
 * @route GET /api/annual-leaves/stats
 * @access Private (Yetkilendirme eklenecek)
 */
const getAnnualLeaveStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Artık userId parametresi beklemiyoruz.
    // const userId = req.params.userId; 
    // if (!userId) { ... }
    try {
        // Tüm kullanıcıları ve ilişkili izinlerini getir (performans için sadece gerekli alanları seç)
        const users = yield prisma.user.findMany({
            // Aktif olmayan kullanıcıları filtrele? (Opsiyonel)
            // where: { isActive: true }, 
            include: {
                annualLeaves: {
                    where: {
                        // Sadece onaylanmış ve bekleyen izinleri dahil et
                        status: { in: [client_1.LeaveStatus.APPROVED, client_1.LeaveStatus.PENDING] }
                    },
                    select: {
                        startDate: true,
                        endDate: true,
                        status: true
                    }
                },
                employee: {
                    select: {
                        annualLeaveAllowance: true,
                        department: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        // Her kullanıcı için istatistikleri hesapla
        const stats = users.map(user => {
            var _a, _b, _c;
            const annualLeaveAllowance = (_b = (_a = user.employee) === null || _a === void 0 ? void 0 : _a.annualLeaveAllowance) !== null && _b !== void 0 ? _b : 14; // Varsayılan 14 gün
            const annualLeaves = user.annualLeaves;
            const department = (_c = user.employee) === null || _c === void 0 ? void 0 : _c.department;
            const approvedLeaves = annualLeaves.filter(l => l.status === client_1.LeaveStatus.APPROVED);
            const pendingLeaves = annualLeaves.filter(l => l.status === client_1.LeaveStatus.PENDING);
            const totalDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateBusinessDays(leave.startDate, leave.endDate), 0);
            const pendingDays = pendingLeaves.reduce((sum, leave) => sum + calculateBusinessDays(leave.startDate, leave.endDate), 0);
            const remainingDays = annualLeaveAllowance - totalDaysUsed;
            return {
                userId: user.id,
                employeeName: `${user.name || ''} ${user.surname || ''}`.trim() || 'İsimsiz',
                departmentName: (department === null || department === void 0 ? void 0 : department.name) || 'Belirtilmemiş',
                totalAnnualAllowance: annualLeaveAllowance,
                totalDaysUsed,
                pendingDays,
                remainingDays
            };
        });
        res.status(200).json(stats); // Hesaplanan istatistik dizisini döndür
    }
    catch (error) {
        console.error("İzin istatistikleri getirme hatası:", error);
        next(error);
    }
});
exports.getAnnualLeaveStats = getAnnualLeaveStats;
// TODO: İzin silme (DELETE /api/annual-leaves/:id) eklenebilir. 
