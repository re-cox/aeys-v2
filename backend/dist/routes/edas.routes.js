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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const error_handler_1 = require("../utils/error-handler");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET: Tüm BEDAŞ/AYEDAŞ bildirimlerini getir
router.get('/bedas/notifications', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[BEDAS API] Bildirimler isteniyor...");
    const { status } = req.query;
    let where = { company: "BEDAŞ" };
    // Durum filtresi varsa uygula
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        where.status = status;
    }
    const notifications = yield prisma.edasNotification.findMany({
        where,
        include: {
            steps: {
                include: {
                    documents: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    console.log(`[BEDAS API] ${notifications.length} bildirim başarıyla alındı.`);
    return res.json({
        success: true,
        data: notifications
    });
})));
// GET: Tek bir BEDAŞ bildirimini getir
router.get('/bedas/notifications/:id', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirim detayı isteniyor...`);
    // ID için ekstra kontrol
    if (!id || id === 'undefined' || id === 'null') {
        console.error(`[BEDAS API] Geçersiz ID: "${id}"`);
        return res.status(400).json({
            success: false,
            message: "Geçersiz bildirim ID'si."
        });
    }
    console.log(`[BEDAS API] Bildirim aranıyor, ID: ${id}`);
    // Prisma ile bildirimi bul
    const notification = yield prisma.edasNotification.findUnique({
        where: { id },
        include: {
            steps: {
                include: {
                    documents: true,
                },
            },
        },
    });
    console.log(`[BEDAS API] Sorgu tamamlandı. Bildirim ${notification ? 'bulundu' : 'bulunamadı'}`);
    if (!notification) {
        console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: `${id} ID'li bildirim bulunamadı.`,
        });
    }
    console.log(`[BEDAS API] ${id} ID'li bildirim başarıyla alındı: ${notification.refNo}`);
    return res.json({
        success: true,
        data: notification,
    });
})));
// POST: Yeni BEDAŞ bildirimi oluştur
router.post('/bedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[BEDAS API] Yeni bildirim oluşturma isteği alındı:`, req.body);
        const body = req.body;
        // İstek içeriği kontrolü
        if (!body) {
            console.error(`[BEDAS API] Geçersiz istek: Body boş`);
            return res.status(400).json({
                success: false,
                message: `Geçersiz istek: Veri gönderilmedi.`
            });
        }
        // Her alanın tipini kontrol et ve loglama yap
        console.log(`[BEDAS API] İstek içeriği analizi:`, {
            refNo: `${body.refNo} (${typeof body.refNo})`,
            customerName: `${body.customerName} (${typeof body.customerName})`,
            applicationType: `${body.applicationType} (${typeof body.applicationType})`,
            projectName: `${body.projectName} (${typeof body.projectName})`,
            city: `${body.city} (${typeof body.city})`,
            district: `${body.district} (${typeof body.district})`,
            parcelBlock: `${body.parcelBlock} (${typeof body.parcelBlock})`,
            parcelNo: `${body.parcelNo} (${typeof body.parcelNo})`,
        });
        // Zorunlu alanları kontrol et
        const requiredFields = ["refNo", "customerName", "applicationType"];
        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            console.error(`[BEDAS API] Eksik zorunlu alanlar: ${missingFields.join(", ")}`);
            return res.status(400).json({
                success: false,
                message: `Zorunlu alanlar eksik: ${missingFields.join(", ")}`
            });
        }
        // Uygulama tipi kontrolü
        if (body.applicationType && !["NIHAI_BAGLANTI", "SANTIYE"].includes(body.applicationType)) {
            console.error(`[BEDAS API] Geçersiz uygulama tipi: ${body.applicationType}`);
            return res.status(400).json({
                success: false,
                message: `Geçersiz uygulama tipi. "NIHAI_BAGLANTI" veya "SANTIYE" olmalıdır.`
            });
        }
        // Referans numarasının benzersiz olup olmadığını kontrol et
        console.log(`[BEDAS API] Referans numarası kontrolü: ${body.refNo}`);
        const existingNotification = yield prisma.edasNotification.findUnique({
            where: { refNo: body.refNo },
        });
        if (existingNotification) {
            console.error(`[BEDAS API] Bildirim zaten mevcut: ${body.refNo}`);
            return res.status(400).json({
                success: false,
                message: `Bu referans numarası (${body.refNo}) ile zaten bir bildirim mevcut.`
            });
        }
        // Yeni bildirim oluştur
        console.log(`[BEDAS API] Bildirim oluşturuluyor...`);
        const newNotification = yield prisma.edasNotification.create({
            data: {
                refNo: body.refNo,
                projectName: body.projectName || null,
                applicationType: body.applicationType,
                customerName: body.customerName,
                city: body.city || null,
                district: body.district || null,
                parcelBlock: body.parcelBlock || null,
                parcelNo: body.parcelNo || null,
                company: "BEDAŞ",
                status: "PENDING",
                currentStep: "PROJE",
                notes: body.notes || null,
                steps: {
                    create: [
                        {
                            stepType: "PROJE",
                            status: "PENDING",
                            refNo: body.refNo + "-P",
                            startDate: new Date(),
                        }
                    ]
                }
            },
            include: {
                steps: true,
            },
        });
        console.log(`[BEDAS API] Bildirim başarıyla oluşturuldu. ID: ${newNotification.id}, RefNo: ${newNotification.refNo}`);
        return res.status(201).json({
            success: true,
            data: newNotification,
            message: "Bildirim başarıyla oluşturuldu."
        });
    }
    catch (error) {
        console.error("[BEDAS API] Bildirim oluşturulurken hata:", error);
        console.error("[BEDAS API] Hata mesajı:", error.message);
        if (error.code)
            console.error("[BEDAS API] Hata kodu:", error.code);
        // Veritabanı bağlantı hataları için özel kontrol
        if (error.code === 'P1001' || error.code === 'P1002') {
            return res.status(500).json({
                success: false,
                message: "Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.",
                error: error.message,
                errorCode: error.code,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined
            });
        }
        // Validasyon hataları
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: "Bu referans numarası ile zaten bir kayıt mevcut.",
                error: error.message,
                errorCode: error.code,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined
            });
        }
        return res.status(500).json({
            success: false,
            message: "Bildirim oluşturulurken bir hata oluştu.",
            error: error.message,
            errorCode: error.code,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}));
// PUT: BEDAŞ bildirimini güncelle
router.put('/bedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const body = req.body;
        // Bildirim var mı kontrol et
        const existingNotification = yield prisma.edasNotification.findUnique({
            where: { id },
        });
        if (!existingNotification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        // Bildirim güncelle
        const updatedNotification = yield prisma.edasNotification.update({
            where: { id },
            data: {
                projectName: body.projectName !== undefined ? body.projectName : existingNotification.projectName,
                customerName: body.customerName || existingNotification.customerName,
                city: body.city !== undefined ? body.city : existingNotification.city,
                district: body.district !== undefined ? body.district : existingNotification.district,
                parcelBlock: body.parcelBlock !== undefined ? body.parcelBlock : existingNotification.parcelBlock,
                parcelNo: body.parcelNo !== undefined ? body.parcelNo : existingNotification.parcelNo,
                status: body.status || existingNotification.status,
                currentStep: body.currentStep || existingNotification.currentStep,
                notes: body.notes !== undefined ? body.notes : existingNotification.notes,
            },
            include: {
                steps: {
                    include: {
                        documents: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            data: updatedNotification,
            message: "Bildirim başarıyla güncellendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Bildirim güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: BEDAŞ bildirimini sil
router.delete('/bedas/notifications/:id', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirim silinme işlemi başlatıldı`);
    // ID için ekstra kontrol
    if (!id || id === 'undefined' || id === 'null') {
        console.error(`[BEDAS API] Geçersiz ID: "${id}"`);
        return res.status(400).json({
            success: false,
            message: "Geçersiz bildirim ID'si."
        });
    }
    console.log(`[BEDAS API] Bildirim aranıyor, ID: ${id}`);
    // Bildirim var mı kontrol et
    const existingNotification = yield prisma.edasNotification.findUnique({
        where: { id },
        include: {
            steps: {
                include: {
                    documents: true
                }
            }
        }
    });
    console.log(`[BEDAS API] Sorgu tamamlandı. Bildirim ${existingNotification ? 'bulundu' : 'bulunamadı'}`);
    if (!existingNotification) {
        console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: `${id} ID'li bildirim bulunamadı.`,
        });
    }
    console.log(`[BEDAS API] Bildirim bulundu, silme işlemi gerçekleştiriliyor: ${existingNotification.refNo}`);
    // Önce belgeleri sil (cascade silinme çalışmıyorsa manuel sileriz)
    if (existingNotification.steps && existingNotification.steps.length > 0) {
        for (const step of existingNotification.steps) {
            if (step.documents && step.documents.length > 0) {
                console.log(`[BEDAS API] ${step.id} ID'li adıma ait ${step.documents.length} belge siliniyor`);
                // Fiziksel dosyaları da sil
                for (const doc of step.documents) {
                    try {
                        if (doc.fileUrl && fs_1.default.existsSync(doc.fileUrl)) {
                            yield fs_1.default.promises.unlink(doc.fileUrl);
                            console.log(`[BEDAS API] Fiziksel dosya silindi: ${doc.fileUrl}`);
                        }
                    }
                    catch (fileError) {
                        console.error(`[BEDAS API] Dosya silinemedi: ${doc.fileUrl}`, fileError);
                        // Hata olsa bile devam et
                    }
                }
                yield prisma.edasNotificationDocument.deleteMany({
                    where: { stepId: step.id }
                });
            }
        }
        // Sonra adımları sil
        console.log(`[BEDAS API] ${existingNotification.steps.length} adım siliniyor`);
        yield prisma.edasNotificationStep.deleteMany({
            where: { notificationId: id }
        });
    }
    // En son bildirimi sil
    yield prisma.edasNotification.delete({
        where: { id },
    });
    console.log(`[BEDAS API] ${id} ID'li bildirim başarıyla silindi.`);
    return res.json({
        success: true,
        message: "Bildirim başarıyla silindi."
    });
})));
// AYEDAŞ bildirimlerini getir
router.get('/ayedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("[AYEDAS API] Bildirimler isteniyor...");
        const { status } = req.query;
        let where = { company: "AYEDAŞ" };
        // Durum filtresi varsa uygula
        if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            where.status = status;
        }
        const notifications = yield prisma.edasNotification.findMany({
            where,
            include: {
                steps: {
                    include: {
                        documents: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`[AYEDAS API] ${notifications.length} bildirim başarıyla alındı.`);
        return res.json({
            success: true,
            data: notifications
        });
    }
    catch (error) {
        const errorMessage = error.message || "Bilinmeyen hata";
        console.error("[AYEDAS API] Bildirimler getirilirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Bildirimler getirilirken bir hata oluştu.",
            error: errorMessage,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}));
// GET: Tek bir AYEDAŞ bildirimini getir
router.get('/ayedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: {
                    include: {
                        documents: true,
                    },
                },
            },
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        // AYEDAŞ kontrolü eklendi
        if (notification.company !== "AYEDAŞ") {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim AYEDAŞ'a ait değil.`, // Daha açıklayıcı mesaj
            });
        }
        return res.json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Tek bildirim getirilirken hata:", error); // Hata loglamayı iyileştir
        return res.status(500).json({
            success: false,
            message: "Bildirim getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: Yeni AYEDAŞ bildirimi oluştur
router.post('/ayedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        // Zorunlu alanları kontrol et
        const requiredFields = ["refNo", "customerName", "applicationType"];
        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Zorunlu alanlar eksik: ${missingFields.join(", ")}`
            });
        }
        // Referans numarasının benzersiz olup olmadığını kontrol et
        const existingNotification = yield prisma.edasNotification.findUnique({
            where: { refNo: body.refNo },
        });
        if (existingNotification) {
            return res.status(400).json({
                success: false,
                message: `Bu referans numarası (${body.refNo}) ile zaten bir bildirim mevcut.`
            });
        }
        // Yeni bildirim oluştur (İlk adımı da ekle)
        const newNotification = yield prisma.edasNotification.create({
            data: {
                refNo: body.refNo,
                projectName: body.projectName || null,
                applicationType: body.applicationType,
                customerName: body.customerName,
                city: body.city || null,
                district: body.district || null,
                parcelBlock: body.parcelBlock || null,
                parcelNo: body.parcelNo || null,
                company: "AYEDAŞ",
                status: "PENDING",
                currentStep: "IC_TESISAT_PROJESI", // AYEDAŞ için ilk adım
                notes: body.notes || null,
                steps: {
                    create: [
                        {
                            stepType: "IC_TESISAT_PROJESI", // AYEDAŞ için ilk adım
                            status: "PENDING",
                            refNo: body.refNo + "-ITP", // Örnek ref no
                            startDate: new Date(),
                        }
                    ]
                }
            },
            include: {
                steps: true,
            },
        });
        return res.status(201).json({
            success: true,
            data: newNotification,
            message: "Bildirim başarıyla oluşturuldu."
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Bildirim oluşturulurken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Bildirim oluşturulurken bir hata oluştu.",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}));
// PUT: AYEDAŞ bildirimini güncelle
router.put('/ayedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const body = req.body;
        // Bildirim var mı kontrol et
        const existingNotification = yield prisma.edasNotification.findUnique({
            where: { id },
        });
        if (!existingNotification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        // Bildirim güncelle
        const updatedNotification = yield prisma.edasNotification.update({
            where: { id },
            data: {
                projectName: body.projectName !== undefined ? body.projectName : existingNotification.projectName,
                customerName: body.customerName || existingNotification.customerName,
                city: body.city !== undefined ? body.city : existingNotification.city,
                district: body.district !== undefined ? body.district : existingNotification.district,
                parcelBlock: body.parcelBlock !== undefined ? body.parcelBlock : existingNotification.parcelBlock,
                parcelNo: body.parcelNo !== undefined ? body.parcelNo : existingNotification.parcelNo,
                status: body.status || existingNotification.status,
                currentStep: body.currentStep || existingNotification.currentStep,
                notes: body.notes !== undefined ? body.notes : existingNotification.notes,
            },
            include: {
                steps: {
                    include: {
                        documents: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            data: updatedNotification,
            message: "Bildirim başarıyla güncellendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Bildirim güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: AYEDAŞ bildirimini sil
router.delete('/ayedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Bildirim var mı kontrol et
        const existingNotification = yield prisma.edasNotification.findUnique({
            where: { id },
        });
        if (!existingNotification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        // Cascade silinme sayesinde adımlar ve belgeler de silinecek
        yield prisma.edasNotification.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: "Bildirim başarıyla silindi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Bildirim silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// ADIMLAR (STEPS) İÇİN API ROUTE'LARI
// POST: BEDAŞ bildirimine yeni adım ekle
router.post('/bedas/notifications/:id/steps', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const body = req.body;
        // Bildirim var mı kontrol et
        const notification = yield prisma.edasNotification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        // Yeni adım oluştur
        const newStep = yield prisma.edasNotificationStep.create({
            data: {
                notificationId: id,
                stepType: body.stepType,
                status: body.status || "PENDING",
                refNo: body.refNo || `${notification.refNo}-${body.stepType.substring(0, 2)}`,
                startDate: body.startDate || new Date(),
                completionDate: body.completionDate || null,
                notes: body.notes || null,
            },
        });
        return res.status(201).json({
            success: true,
            data: newStep,
            message: "Adım başarıyla eklendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Adım eklenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// PUT: BEDAŞ bildiriminin adımını güncelle
router.put('/bedas/notifications/:notificationId/steps/:stepId/old', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const body = req.body;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Adımı güncelle
        const updatedStep = yield prisma.edasNotificationStep.update({
            where: { id: stepId },
            data: {
                status: body.status || step.status,
                refNo: body.refNo || step.refNo,
                startDate: body.startDate || step.startDate,
                completionDate: body.completionDate !== undefined ? body.completionDate : step.completionDate,
                notes: body.notes !== undefined ? body.notes : step.notes,
            },
            include: {
                documents: true,
            },
        });
        // Eğer tüm adımlar tamamlandıysa bildirimin durumunu güncelle
        if (body.status === "APPROVED") {
            const allSteps = yield prisma.edasNotificationStep.findMany({
                where: { notificationId: notificationId },
            });
            const allApproved = allSteps.every(s => s.status === "APPROVED");
            if (allApproved) {
                yield prisma.edasNotification.update({
                    where: { id: notificationId },
                    data: { status: "APPROVED" },
                });
            }
        }
        return res.json({
            success: true,
            data: updatedStep,
            message: "Adım başarıyla güncellendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Adım güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: BEDAŞ bildiriminin adımını sil
router.delete('/bedas/notifications/:notificationId/steps/:stepId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Adımı sil (Cascade silme ile belgeler de silinecek)
        yield prisma.edasNotificationStep.delete({
            where: { id: stepId },
        });
        return res.json({
            success: true,
            message: "Adım başarıyla silindi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Adım silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: AYEDAŞ bildirimine yeni adım ekle (Yeni Eklendi)
router.post('/ayedas/notifications/:id/steps', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // notificationId
        const body = req.body; // { stepType, status?, refNo?, startDate?, completionDate?, notes? }
        // Bildirim var mı ve AYEDAŞ mı kontrol et
        const notification = yield prisma.edasNotification.findFirst({
            where: { id: id, company: "AYEDAŞ" },
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li AYEDAŞ bildirimi bulunamadı.`,
            });
        }
        // Gelen stepType geçerli mi kontrol et (isteğe bağlı)
        // if (!Object.values(AyedasNotificationType).includes(body.stepType)) { ... }
        // Bu adım zaten var mı kontrol et
        const existingStep = yield prisma.edasNotificationStep.findFirst({
            where: {
                notificationId: id,
                stepType: body.stepType,
            },
        });
        if (existingStep) {
            return res.status(400).json({
                success: false,
                message: `Bu bildirimde ${body.stepType} adımı zaten mevcut. Güncelleme için PUT kullanın.`,
            });
        }
        // Yeni adım oluştur
        const newStep = yield prisma.edasNotificationStep.create({
            data: {
                notificationId: id,
                stepType: body.stepType,
                status: body.status || "PENDING",
                refNo: body.refNo || `${notification.refNo}-${body.stepType.substring(0, 3)}`,
                startDate: body.startDate ? new Date(body.startDate) : new Date(),
                completionDate: body.completionDate ? new Date(body.completionDate) : null,
                notes: body.notes || null,
            },
            include: {
                documents: true, // Belgeleri de döndür
            }
        });
        return res.status(201).json({
            success: true,
            data: newStep,
            message: "Adım başarıyla eklendi."
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Adım eklenirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Adım eklenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// PUT: AYEDAŞ bildiriminin adımını güncelle
router.put('/ayedas/notifications/:notificationId/steps/:stepId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const body = req.body;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Adımı güncelle
        const updatedStep = yield prisma.edasNotificationStep.update({
            where: { id: stepId },
            data: {
                status: body.status || step.status,
                refNo: body.refNo || step.refNo,
                startDate: body.startDate || step.startDate,
                completionDate: body.completionDate !== undefined ? body.completionDate : step.completionDate,
                notes: body.notes !== undefined ? body.notes : step.notes,
            },
            include: {
                documents: true,
            },
        });
        // Eğer tüm adımlar tamamlandıysa bildirimin durumunu güncelle
        if (body.status === "APPROVED") {
            const allSteps = yield prisma.edasNotificationStep.findMany({
                where: { notificationId: notificationId },
            });
            const allApproved = allSteps.every(s => s.status === "APPROVED");
            if (allApproved) {
                yield prisma.edasNotification.update({
                    where: { id: notificationId },
                    data: { status: "APPROVED" },
                });
            }
        }
        return res.json({
            success: true,
            data: updatedStep,
            message: "Adım başarıyla güncellendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Adım güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: AYEDAŞ bildiriminin adımını sil
router.delete('/ayedas/notifications/:notificationId/steps/:stepId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Adımı sil (Cascade silme ile belgeler de silinecek)
        yield prisma.edasNotificationStep.delete({
            where: { id: stepId },
        });
        return res.json({
            success: true,
            message: "Adım başarıyla silindi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Adım silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// BELGELER (DOCUMENTS) İÇİN API ROUTE'LARI
// POST: BEDAŞ bildiriminin adımına belge ekle (eski)
router.post('/bedas/notifications/:notificationId/steps/:stepId/documents/old', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const body = req.body;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Belge oluştur
        const newDocument = yield prisma.edasNotificationDocument.create({
            data: {
                stepId: stepId,
                fileUrl: body.fileUrl,
                fileName: body.fileName,
                fileType: body.fileType,
                fileSize: body.fileSize,
            },
        });
        return res.status(201).json({
            success: true,
            data: newDocument,
            message: "Belge başarıyla eklendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Belge eklenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: BEDAŞ bildirimi belgesini sil
router.delete('/bedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { documentId } = req.params;
        // Belge var mı kontrol et
        const document = yield prisma.edasNotificationDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı.`,
            });
        }
        // Belgeyi sil
        yield prisma.edasNotificationDocument.delete({
            where: { id: documentId },
        });
        return res.json({
            success: true,
            message: "Belge başarıyla silindi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Belge silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: AYEDAŞ bildiriminin adımına belge ekle
router.post('/ayedas/notifications/:notificationId/steps/:stepId/documents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const body = req.body;
        // Adım var mı kontrol et
        const step = yield prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
            },
        });
        if (!step) {
            return res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`,
            });
        }
        // Belge oluştur
        const newDocument = yield prisma.edasNotificationDocument.create({
            data: {
                stepId: stepId,
                fileUrl: body.fileUrl,
                fileName: body.fileName,
                fileType: body.fileType,
                fileSize: body.fileSize,
            },
        });
        return res.status(201).json({
            success: true,
            data: newDocument,
            message: "Belge başarıyla eklendi."
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Belge eklenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: AYEDAŞ bildirimi belgesini sil
router.delete('/ayedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params; // Parametreleri al
        // Belge var mı ve doğru adıma/bildirime mi ait kontrol et (opsiyonel ama önerilir)
        const document = yield prisma.edasNotificationDocument.findFirst({
            where: {
                id: documentId,
                step: {
                    id: stepId,
                    notificationId: notificationId,
                    notification: {
                        company: "AYEDAŞ" // AYEDAŞ kontrolü
                    }
                }
            }
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen AYEDAŞ bildirim/adımına ait değil.`,
            });
        }
        // Belgeyi sil
        yield prisma.edasNotificationDocument.delete({
            where: { id: documentId },
        });
        // TODO: Gerçek senaryoda, dosya sisteminden veya bulut depolamadan da belgeyi silmek gerekebilir.
        // Örnek: fs.unlinkSync(document.fileUrl);
        return res.json({
            success: true,
            message: "Belge başarıyla silindi."
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Belge silinirken hata:", error); // Hata loglamayı iyileştir
        return res.status(500).json({
            success: false,
            message: "Belge silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// GET: AYEDAŞ bildirimi belgesini indir (Yeni Eklendi)
router.get('/ayedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params;
        const document = yield prisma.edasNotificationDocument.findFirst({
            where: {
                id: documentId,
                step: {
                    id: stepId,
                    notificationId: notificationId,
                    notification: {
                        company: "AYEDAŞ"
                    }
                }
            }
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen AYEDAŞ bildirim/adımına ait değil.`,
            });
        }
        // --- Gerçek Dosya İndirme Mantığı ---
        // Bu kısım, dosyaların nasıl saklandığına bağlı olarak değişir.
        // Eğer dosyalar doğrudan erişilebilir bir URL'de ise (örn: S3, public folder):
        // return res.redirect(document.fileUrl);
        // Eğer dosyalar backend'in erişebileceği bir yerde ise:
        // const filePath = path.join(__dirname, '..', '..', document.fileUrl); // Örnek dosya yolu
        // if (fs.existsSync(filePath)) {
        //   res.setHeader('Content-Disposition', `attachment; filename=${document.fileName}`); // İndirme başlığını ayarla
        //   res.setHeader('Content-Type', document.fileType); // MIME türünü ayarla
        //   return res.sendFile(filePath);
        // } else {
        //   return res.status(404).json({ success: false, message: 'Dosya bulunamadı.' });
        // }
        // Şimdilik, dosya indirme yerine sadece belge bilgilerini döndürelim (test amaçlı)
        console.warn(`[AYEDAS API] Belge indirme simülasyonu: ${document.fileName} (ID: ${documentId})`);
        return res.json({
            success: true,
            message: "İndirme simülasyonu başarılı. Gerçek implementasyon gerekiyor.",
            data: document // Frontend'in test edebilmesi için belge verisini döndür
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Belge indirilirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Belge indirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// ADIM İŞLEMLERİ - EKSIK API'LER
// PUT: BEDAŞ adım durumu güncelleme
router.put('/bedas/notifications/:id/steps/:stepType', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, stepType } = req.params;
        const { status, notes } = req.body;
        console.log(`[BEDAS API] ${id} ID'li bildirimin ${stepType} adımı durumu güncelleniyor. Yeni durum: ${status}`);
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Geçersiz durum değeri. PENDING, APPROVED veya REJECTED olmalıdır."
            });
        }
        // Bildirimi kontrol et
        const notification = yield prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: true,
            },
        });
        if (!notification) {
            console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`
            });
        }
        if (notification.company !== "BEDAŞ") {
            console.log(`[BEDAS API] ${id} ID'li bildirim BEDAŞ'a ait değil.`);
            return res.status(400).json({
                success: false,
                message: `${id} ID'li bildirim BEDAŞ'a ait değil.`
            });
        }
        // İlgili adımı bul
        const step = notification.steps.find(s => s.stepType === stepType);
        if (!step) {
            console.log(`[BEDAS API] ${stepType} adımı bulunamadı, oluşturuluyor...`);
            // Adım yoksa oluştur
            const newStep = yield prisma.edasNotificationStep.create({
                data: {
                    notificationId: id,
                    stepType,
                    status,
                    notes: notes || null,
                    startDate: new Date(),
                    refNo: `${notification.refNo}-${stepType.substring(0, 3)}`,
                },
            });
            console.log(`[BEDAS API] Yeni adım oluşturuldu. ID: ${newStep.id}, Durum: ${status}`);
            return res.json({
                success: true,
                data: {
                    step: newStep,
                    notificationStatus: notification.status, // Bildirimin genel durumu değişmedi
                    currentStep: notification.currentStep, // Mevcut adım değişmedi
                },
                message: "Adım başarıyla oluşturuldu ve durumu ayarlandı."
            });
        }
        console.log(`[BEDAS API] ${step.id} ID'li adım bulundu. Mevcut durum: ${step.status}, Yeni durum: ${status}`);
        // Adımı güncelle
        const updatedStep = yield prisma.edasNotificationStep.update({
            where: { id: step.id },
            data: {
                status,
                notes: notes !== undefined ? notes : step.notes,
                completionDate: status === 'APPROVED' || status === 'REJECTED' ? new Date() : step.completionDate,
            },
        });
        console.log(`[BEDAS API] Adım başarıyla güncellendi. ID: ${updatedStep.id}, Durum: ${updatedStep.status}`);
        // Bildirimin genel durumunu ve mevcut adımını güncelleme
        let notificationStatus = notification.status;
        let currentStep = notification.currentStep;
        // Adım onaylandıysa, sonraki adıma geç
        if (status === 'APPROVED' && stepType === notification.currentStep) {
            const stepOrder = [
                "PROJE",
                "BAGLANTI_GORUSU",
                "DAGITIM_BAGLANTI_ANLASMASI",
                "TESISIN_TAMAMLANMASI",
                "FEN_MUAYENE"
            ];
            const currentIndex = stepOrder.indexOf(stepType);
            if (currentIndex !== -1 && currentIndex < stepOrder.length - 1) {
                currentStep = stepOrder[currentIndex + 1];
                console.log(`[BEDAS API] Bir sonraki adıma geçiliyor: ${currentStep}`);
            }
            // Son adım onaylandıysa, tüm bildirimi onayla
            if (currentIndex === stepOrder.length - 1) {
                notificationStatus = 'APPROVED';
                console.log(`[BEDAS API] Son adım onaylandı, bildirim durumu APPROVED olarak değiştiriliyor.`);
            }
            // Bildirimi güncelle
            yield prisma.edasNotification.update({
                where: { id },
                data: {
                    status: notificationStatus,
                    currentStep,
                },
            });
            console.log(`[BEDAS API] Bildirim güncellendi. Durum: ${notificationStatus}, Mevcut Adım: ${currentStep}`);
        }
        // Adım reddedildiyse, bildirimi de reddet
        if (status === 'REJECTED') {
            notificationStatus = 'REJECTED';
            yield prisma.edasNotification.update({
                where: { id },
                data: {
                    status: notificationStatus,
                },
            });
            console.log(`[BEDAS API] Adım reddedildi, bildirim durumu REJECTED olarak değiştiriliyor.`);
        }
        return res.json({
            success: true,
            data: {
                step: updatedStep,
                notificationStatus,
                currentStep,
            },
            message: "Adım durumu başarıyla güncellendi."
        });
    }
    catch (error) {
        console.error("[BEDAS API] Adım durumu güncellenirken hata:", error);
        console.error("[BEDAS API] Hata detayı:", error.message);
        console.error("[BEDAS API] Hata stack:", error.stack);
        if (error.code)
            console.error("[BEDAS API] Hata kodu:", error.code);
        return res.status(500).json({
            success: false,
            message: "Adım durumu güncellenirken bir hata oluştu.",
            error: error.message,
            errorCode: error.code,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}));
// PUT: Adım referans numarasını güncelleme
router.put('/bedas/notifications/:id/steps/:stepType/ref-no', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, stepType } = req.params;
        const { refNo } = req.body;
        if (!refNo || typeof refNo !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Geçerli bir referans numarası gereklidir."
            });
        }
        // Bildirimi kontrol et
        const notification = yield prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: true,
            },
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`
            });
        }
        // İlgili adımı bul
        const step = notification.steps.find(s => s.stepType === stepType);
        if (!step) {
            // Adım yoksa oluştur
            const newStep = yield prisma.edasNotificationStep.create({
                data: {
                    notificationId: id,
                    stepType,
                    status: 'PENDING',
                    refNo,
                    startDate: new Date(),
                },
            });
            return res.json({
                success: true,
                data: newStep,
                message: "Adım başarıyla oluşturuldu ve referans numarası ayarlandı."
            });
        }
        // Adımı güncelle
        const updatedStep = yield prisma.edasNotificationStep.update({
            where: { id: step.id },
            data: {
                refNo,
            },
        });
        return res.json({
            success: true,
            data: updatedStep,
            message: "Adım referans numarası başarıyla güncellendi."
        });
    }
    catch (error) {
        console.error("Referans numarası güncellenirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Referans numarası güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: Adıma belge yükleme
router.post('/bedas/notifications/:id/steps/:stepType/documents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, stepType } = req.params;
        console.log(`[BEDAS API] ${id} ID'li bildirimin ${stepType} adımına belge yükleme isteği alındı`);
        // Multipart form-data kontrolü
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Yüklenecek dosya bulunamadı."
            });
        }
        // Belge türü kontrolü
        if (!req.body.documentType) {
            return res.status(400).json({
                success: false,
                message: "Belge türü belirtilmelidir."
            });
        }
        console.log(`[BEDAS API] Yüklenecek dosya sayısı:`, req.files.files ? (Array.isArray(req.files.files) ? req.files.files.length : 1) : 0);
        console.log(`[BEDAS API] Belge türü: ${req.body.documentType}`);
        // Bildirimi kontrol et
        const notification = yield prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: true,
            },
        });
        if (!notification) {
            console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`
            });
        }
        // İlgili adımı bul veya oluştur
        let step = notification.steps.find(s => s.stepType === stepType);
        if (!step) {
            console.log(`[BEDAS API] ${stepType} adımı bulunamadı, oluşturuluyor...`);
            step = yield prisma.edasNotificationStep.create({
                data: {
                    notificationId: id,
                    stepType,
                    status: 'PENDING',
                    refNo: `${notification.refNo}-${stepType.substring(0, 3)}`,
                    startDate: new Date(),
                },
            });
        }
        // Dosyaları işle ve veritabanına kaydet
        const uploadPath = `uploads/bedas/${id}/${stepType}`;
        let files = req.files.files;
        // Tekil dosya için array dönüşümü yap
        if (!Array.isArray(files)) {
            files = [files];
        }
        const documentType = req.body.documentType;
        const savedDocuments = [];
        console.log(`[BEDAS API] ${files.length} dosya işlenecek, yükleme klasörü: ${uploadPath}`);
        // Yükleme klasörünü oluştur
        try {
            yield fs_1.default.promises.mkdir(uploadPath, { recursive: true });
            console.log(`[BEDAS API] Klasör oluşturuldu: ${uploadPath}`);
        }
        catch (err) {
            console.error(`[BEDAS API] Klasör oluşturma hatası:`, err);
        }
        for (const file of files) {
            try {
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const filePath = `${uploadPath}/${fileName}`;
                // Dosyayı yükle
                yield file.mv(filePath);
                console.log(`[BEDAS API] Dosya başarıyla yüklendi: ${filePath}`);
                // Veritabanına belge kaydı ekle
                const savedDocument = yield prisma.edasNotificationDocument.create({
                    data: {
                        stepId: step.id,
                        fileUrl: filePath,
                        fileName: `${documentType} - ${file.name}`,
                        fileType: file.mimetype,
                        fileSize: file.size,
                    },
                });
                savedDocuments.push(savedDocument);
                console.log(`[BEDAS API] Belge kaydı oluşturuldu, ID: ${savedDocument.id}`);
            }
            catch (fileError) {
                console.error(`[BEDAS API] Dosya işleme hatası:`, fileError);
            }
        }
        console.log(`[BEDAS API] Toplam ${savedDocuments.length} belge başarıyla işlendi`);
        return res.json({
            success: true,
            data: {
                step,
                documents: savedDocuments,
            },
            message: "Belgeler başarıyla yüklendi."
        });
    }
    catch (error) {
        console.error("[BEDAS API] Belge yüklenirken hata:", error);
        console.error("[BEDAS API] Hata detayı:", error.message);
        if (error.code)
            console.error("[BEDAS API] Hata kodu:", error.code);
        return res.status(500).json({
            success: false,
            message: "Belgeler yüklenirken bir hata oluştu.",
            error: error.message,
            errorCode: error.code,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}));
// GET: Belge indirme
router.get('/bedas/notifications/:id/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { documentId } = req.params;
        // Belgeyi veritabanından bul
        const document = yield prisma.edasNotificationDocument.findUnique({
            where: { id: documentId },
            include: {
                step: {
                    include: {
                        notification: true,
                    },
                },
            },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Belge bulunamadı."
            });
        }
        // Dosya yolunu al
        const filePath = document.fileUrl;
        // Dosyanın var olup olmadığını kontrol et
        try {
            yield fs_1.default.promises.access(filePath);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                message: "Dosya sistemde bulunamadı."
            });
        }
        // Dosyayı gönder
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.setHeader('Content-Type', document.fileType);
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error("Belge indirilirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Belge indirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: Belge silme
router.delete('/bedas/notifications/:id/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { documentId } = req.params;
        // Belgeyi veritabanından bul
        const document = yield prisma.edasNotificationDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Belge bulunamadı."
            });
        }
        // Dosya yolunu al
        const filePath = document.fileUrl;
        // Dosyayı veritabanından sil
        yield prisma.edasNotificationDocument.delete({
            where: { id: documentId },
        });
        // Dosyayı fiziksel olarak da sil (eğer mevcutsa)
        try {
            yield fs_1.default.promises.access(filePath);
            yield fs_1.default.promises.unlink(filePath);
        }
        catch (error) {
            // Dosya bulunamadıysa, sadece bir log kaydı oluştur ama işleme devam et
            console.warn(`Dosya sistemde bulunamadı: ${filePath}`);
        }
        return res.json({
            success: true,
            message: "Belge başarıyla silindi."
        });
    }
    catch (error) {
        console.error("Belge silinirken hata:", error);
        return res.status(500).json({
            success: false,
            message: "Belge silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: Belge yükleme
router.post('/bedas/notifications/:id/documents', (0, express_fileupload_1.default)({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    abortOnLimit: true
}), (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirime belge yükleme isteği alındı`);
    // Dosya kontrolü
    if (!req.files || Object.keys(req.files).length === 0) {
        console.error(`[BEDAS API] Dosya bulunamadı`);
        return res.status(400).json({
            success: false,
            message: "Yüklenecek dosya bulunamadı."
        });
    }
    // Bildirim var mı kontrol et
    const notification = yield prisma.edasNotification.findUnique({
        where: { id },
        include: {
            steps: true
        }
    });
    if (!notification) {
        console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: `${id} ID'li bildirim bulunamadı.`
        });
    }
    // Yükleme klasörünü oluştur
    const uploadPath = `uploads/bedas/${id}/documents`;
    try {
        yield fs_1.default.promises.mkdir(uploadPath, { recursive: true });
        console.log(`[BEDAS API] Klasör oluşturuldu: ${uploadPath}`);
    }
    catch (err) {
        console.error(`[BEDAS API] Klasör oluşturma hatası:`, err);
    }
    let file;
    // Tek dosya kontrolü
    if (Array.isArray(req.files.file)) {
        file = req.files.file[0];
    }
    else {
        file = req.files.file;
    }
    // Dosyayı yükle
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${uploadPath}/${fileName}`;
    yield file.mv(filePath);
    console.log(`[BEDAS API] Dosya başarıyla yüklendi: ${filePath}`);
    // Veritabanına belge kaydı ekle
    const document = yield prisma.edasNotificationDocument.create({
        data: {
            step: {
                connect: {
                    id: ((_a = notification.steps[0]) === null || _a === void 0 ? void 0 : _a.id) ||
                        // Eğer adım yoksa hata ver
                        (() => { throw new Error("Bildirime ait adım bulunamadı. Önce bir adım oluşturun."); })()
                }
            },
            fileUrl: filePath,
            fileName: file.name,
            fileType: file.mimetype,
            fileSize: file.size,
        },
    });
    console.log(`[BEDAS API] Belge kaydı oluşturuldu, ID: ${document.id}`);
    return res.json({
        success: true,
        data: document,
        message: "Belge başarıyla yüklendi."
    });
})));
// GET: Tüm belgeleri getir 
router.get('/bedas/notifications/:id/documents', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirimin belgeleri isteniyor...`);
    // Bildirimi adımları ve belgeleriyle birlikte getir
    const notification = yield prisma.edasNotification.findUnique({
        where: { id },
        include: {
            steps: {
                include: {
                    documents: true
                }
            }
        }
    });
    if (!notification) {
        console.log(`[BEDAS API] ${id} ID'li bildirim bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: `${id} ID'li bildirim bulunamadı.`
        });
    }
    // Tüm belgeleri düz bir dizi olarak topla
    const allDocuments = notification.steps.flatMap(step => step.documents);
    console.log(`[BEDAS API] ${allDocuments.length} belge bulundu.`);
    return res.json({
        success: true,
        data: allDocuments
    });
})));
// GET: Belge indirme - Hatasız hale getirildi
router.get('/bedas/notifications/:id/documents/:documentId', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, documentId } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirimin ${documentId} ID'li belgesi isteniyor...`);
    // Belgeyi veritabanından bul
    const document = yield prisma.edasNotificationDocument.findUnique({
        where: { id: documentId },
        include: {
            step: {
                include: {
                    notification: true,
                },
            },
        },
    });
    if (!document) {
        console.error(`[BEDAS API] ${documentId} ID'li belge bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: "Belge bulunamadı."
        });
    }
    // Bildirimin doğru olduğunu kontrol et
    if (document.step.notification.id !== id) {
        console.error(`[BEDAS API] Belge bu bildirime ait değil.`);
        return res.status(403).json({
            success: false,
            message: "Belge bu bildirime ait değil."
        });
    }
    // Dosya yolunu al
    const filePath = document.fileUrl;
    // Dosyanın var olup olmadığını kontrol et
    try {
        yield fs_1.default.promises.access(filePath);
    }
    catch (error) {
        console.error(`[BEDAS API] Dosya sistemde bulunamadı: ${filePath}`);
        return res.status(404).json({
            success: false,
            message: "Dosya sistemde bulunamadı."
        });
    }
    // Dosyayı gönder
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.fileType);
    const fileStream = fs_1.default.createReadStream(filePath);
    fileStream.pipe(res);
})));
// DELETE: Belge silme - Hatasız hale getirildi
router.delete('/bedas/notifications/:id/documents/:documentId', (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, documentId } = req.params;
    console.log(`[BEDAS API] ${id} ID'li bildirimin ${documentId} ID'li belgesi siliniyor...`);
    // Belgeyi veritabanından bul
    const document = yield prisma.edasNotificationDocument.findUnique({
        where: { id: documentId },
        include: {
            step: {
                include: {
                    notification: true,
                },
            },
        },
    });
    if (!document) {
        console.error(`[BEDAS API] ${documentId} ID'li belge bulunamadı.`);
        return res.status(404).json({
            success: false,
            message: "Belge bulunamadı."
        });
    }
    // Bildirimin doğru olduğunu kontrol et
    if (document.step.notification.id !== id) {
        console.error(`[BEDAS API] Belge bu bildirime ait değil.`);
        return res.status(403).json({
            success: false,
            message: "Belge bu bildirime ait değil."
        });
    }
    // Dosya yolunu al
    const filePath = document.fileUrl;
    // Dosyayı veritabanından sil
    yield prisma.edasNotificationDocument.delete({
        where: { id: documentId },
    });
    // Dosyayı fiziksel olarak da sil (eğer mevcutsa)
    try {
        if (fs_1.default.existsSync(filePath)) {
            yield fs_1.default.promises.unlink(filePath);
            console.log(`[BEDAS API] Fiziksel dosya silindi: ${filePath}`);
        }
        else {
            console.warn(`[BEDAS API] Dosya sistemde bulunamadı: ${filePath}`);
        }
    }
    catch (error) {
        // Dosya bulunamadıysa, sadece bir log kaydı oluştur ama işleme devam et
        console.warn(`[BEDAS API] Dosya silme hatası: ${filePath}`, error);
    }
    console.log(`[BEDAS API] ${documentId} ID'li belge başarıyla silindi.`);
    return res.json({
        success: true,
        message: "Belge başarıyla silindi."
    });
})));
exports.default = router;
