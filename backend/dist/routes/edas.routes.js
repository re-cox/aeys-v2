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
const multer_middleware_1 = require("../middlewares/multer.middleware");
const fs_1 = __importDefault(require("fs")); // fs modülünü import et
const path_1 = __importDefault(require("path")); // path modülünü import et
const router = express_1.default.Router();
// AYEDAŞ BİLDİRİM İŞLEMLERİ
// GET: Tüm AYEDAŞ bildirimlerini getir
router.get('/ayedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.prisma.edasNotification.findMany({
            where: { company: "AYEDAŞ" },
            include: {
                steps: {
                    orderBy: {
                        stepType: 'asc'
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        console.log(`[AYEDAS API] ${notifications.length} adet AYEDAŞ bildirimi bulundu.`);
        res.json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Bildirimler getirilirken hata:", error);
        res.status(500).json({
            success: false,
            message: "Bildirimler getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// GET: Tek bir AYEDAŞ bildirimini getir
router.get('/ayedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma_1.prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                    include: {
                        documents: true
                    }
                },
            },
        });
        if (!notification) {
            res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`
            });
            return;
        }
        if (notification.company !== "AYEDAŞ") {
            res.status(400).json({
                success: false,
                message: `${id} ID'li bildirim AYEDAŞ'a ait değil.`
            });
            return;
        }
        console.log(`[AYEDAS API] ${id} ID'li AYEDAŞ bildirimi bulundu.`);
        res.json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        console.error(`[AYEDAS API] ${req.params.id} ID'li bildirim getirilirken hata:`, error);
        res.status(500).json({
            success: false,
            message: "Bildirim getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: Yeni AYEDAŞ bildirimi oluştur
router.post('/ayedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        data.company = "AYEDAŞ"; // Şirketi AYEDAŞ olarak ayarla
        console.log("[AYEDAS API] Yeni AYEDAŞ bildirimi oluşturuluyor, veri:", data);
        const newNotification = yield prisma_1.prisma.edasNotification.create({
            data: {
                company: data.company,
                refNo: data.refNo,
                applicationType: data.applicationType,
                status: 'PENDING',
                currentStep: "IC_TESISAT_PROJESI",
                projectName: data.projectName,
                customerName: data.customerName,
                city: data.city,
                district: data.district,
                parcelBlock: data.parcelBlock,
                parcelNo: data.parcelNo,
            },
        });
        console.log(`[AYEDAS API] Yeni AYEDAŞ bildirimi başarıyla oluşturuldu: ${newNotification.id}`);
        res.status(201).json({
            success: true,
            data: newNotification,
            message: "AYEDAŞ bildirimi başarıyla oluşturuldu."
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Yeni bildirim oluşturulurken hata:", error);
        res.status(500).json({
            success: false,
            message: "Bildirim oluşturulurken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// PUT: AYEDAŞ bildirimini güncelle
router.put('/ayedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        console.log(`[AYEDAS API] ${id} ID'li AYEDAŞ bildirimi güncelleniyor, veri:`, data);
        // Şirket adı değiştirilemez
        delete data.company;
        const updatedNotification = yield prisma_1.prisma.edasNotification.update({
            where: { id },
            data: data,
        });
        console.log(`[AYEDAS API] ${id} ID'li AYEDAŞ bildirimi başarıyla güncellendi.`);
        res.json({
            success: true,
            data: updatedNotification,
            message: "AYEDAŞ bildirimi başarıyla güncellendi."
        });
    }
    catch (error) {
        console.error(`[AYEDAS API] ${req.params.id} ID'li bildirim güncellenirken hata:`, error);
        // Prisma'nın özel hata kodlarını kontrol et (örn: P2025 - Kayıt bulunamadı)
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: `${req.params.id} ID'li bildirim bulunamadı.`,
            });
            return;
        }
        res.status(500).json({
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
        console.log(`[AYEDAS API] ${id} ID'li AYEDAŞ bildirimi siliniyor...`);
        // Önce ilişkili adımları ve belgeleri silmek gerekebilir (Cascade delete ayarlanmadıysa)
        // await prisma.edasNotificationDocument.deleteMany({ where: { step: { notificationId: id } } });
        // await prisma.edasNotificationStep.deleteMany({ where: { notificationId: id } });
        yield prisma_1.prisma.edasNotification.delete({
            where: { id },
        });
        console.log(`[AYEDAS API] ${id} ID'li AYEDAŞ bildirimi başarıyla silindi.`);
        res.json({ success: true, message: "Bildirim başarıyla silindi." });
    }
    catch (error) {
        console.error(`[AYEDAS API] ${req.params.id} ID'li bildirim silinirken hata:`, error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: `${req.params.id} ID'li bildirim bulunamadı.`,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Bildirim silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// AYEDAŞ BİLDİRİM ADIMLARI
// POST: AYEDAŞ bildirimine yeni adım ekle veya güncelle
router.post('/ayedas/notifications/:notificationId/steps', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const { stepType, status, notes } = req.body;
        console.log(`[AYEDAS API] Bildirim ${notificationId}, Adım ${stepType}, Durum ${status}`);
        // Bildirim var mı kontrol et
        const notification = yield prisma_1.prisma.edasNotification.findUnique({
            where: { id: notificationId }
        });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Bildirim bulunamadı.' });
            return;
        }
        // Adım zaten var mı kontrol et
        let step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                notificationId: notificationId,
                stepType: stepType,
            },
        });
        let resultData;
        let statusCode = 200;
        let messageAction = 'güncellendi';
        if (step) {
            // Adım varsa güncelle
            console.log(`[AYEDAS API] Adım ${stepType} güncelleniyor.`);
            step = yield prisma_1.prisma.edasNotificationStep.update({
                where: { id: step.id },
                data: { status, notes },
            });
            resultData = { step, notification };
        }
        else {
            // Adım yoksa oluştur
            console.log(`[AYEDAS API] Adım ${stepType} oluşturuluyor.`);
            statusCode = 201;
            messageAction = 'oluşturuldu';
            step = yield prisma_1.prisma.edasNotificationStep.create({
                data: {
                    notificationId: notificationId,
                    stepType: stepType,
                    status: status,
                    notes: notes,
                },
            });
            resultData = { step, notification };
        }
        res.status(statusCode).json({
            success: true,
            data: resultData,
            message: `Adım ${stepType} başarıyla ${messageAction}.`
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Adım işlenirken hata:", error);
        res.status(500).json({
            success: false,
            message: "Adım işlenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// PUT: AYEDAŞ adım durumu güncelleme (POST endpoint'i ile birleştirildiği için bu gereksiz olabilir)
router.put('/ayedas/notifications/:notificationId/steps/:stepId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const { status, notes } = req.body;
        console.log(`[AYEDAS API] Step Update Request: notificationId=${notificationId}, stepId=${stepId}, status=${status}`);
        // Adım var mı kontrol et
        const step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId
            }
        });
        if (!step) {
            console.log(`[AYEDAS API] Step not found: ${stepId}`);
            res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı.`
            });
            return;
        }
        // Adımı güncelle
        const updatedStep = yield prisma_1.prisma.edasNotificationStep.update({
            where: { id: stepId },
            data: { status, notes },
            include: {
                notification: true
            }
        });
        console.log(`[AYEDAS API] Step ${stepId} updated successfully.`);
        res.json({
            success: true,
            data: { step: updatedStep, notification: updatedStep.notification }, // Frontend'in beklediği yapıya uygun döndür
            message: "Adım durumu başarıyla güncellendi."
        });
    }
    catch (error) {
        console.error("[AYEDAS API] Adım güncellenirken hata:", error);
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Güncellenecek adım bulunamadı.' });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Adım güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// AYEDAŞ BİLDİRİM BELGELERİ
// GET: AYEDAŞ bildiriminin adımına ait belgeleri getir
router.get('/ayedas/notifications/:notificationId/steps/:stepId/documents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const documents = yield prisma_1.prisma.edasNotificationDocument.findMany({
            where: {
                stepId: stepId,
                step: {
                    notificationId: notificationId,
                },
            },
        });
        res.json({ success: true, data: documents });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Belgeler getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: AYEDAŞ bildiriminin adımına belge ekle
router.post('/ayedas/notifications/:notificationId/steps/:stepId/documents', multer_middleware_1.upload.single('file'), // Multer middleware'ini ekle
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const file = req.file; // Yüklenen dosya bilgisi
        const body = req.body; // Metin alanları
        if (!file) {
            res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });
            return;
        }
        // Adım var mı ve AYEDAŞ'a mı ait kontrol et
        const step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
                notification: {
                    company: "AYEDAŞ"
                }
            },
        });
        if (!step) {
            // Geçici dosya oluştuysa sil
            try {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            catch (unlinkError) {
                console.error("Dosya silinirken hata oluştu:", unlinkError);
            }
            res.status(404).json({
                success: false,
                message: `${stepId} ID'li AYEDAŞ adımı bulunamadı.`,
            });
            return;
        }
        // fileUrl'yi backend'de oluştur
        const generatedFileUrl = `/uploads/edas-documents/${file.filename}`;
        console.log("[AYEDAS Upload] Received file:", file);
        console.log("[AYEDAS Upload] Received body:", body);
        // Veritabanına kaydedilecek veriyi hazırla
        const documentData = {
            stepId: stepId,
            fileUrl: generatedFileUrl, // Backend'de oluşturulan URL
            originalName: file.originalname, // Orijinal dosya adını sakla
            fileName: file.filename, // Multer tarafından üretilen dosya adını sakla
            fileType: file.mimetype,
            fileSize: file.size,
        };
        console.log("[AYEDAS Upload] Data for Prisma:", documentData);
        // Alanların undefined/null olmadığını kontrol et (fileSize için NaN kontrolü)
        if (!documentData.stepId || !documentData.fileUrl || !documentData.originalName || !documentData.fileName || !documentData.fileType || isNaN(documentData.fileSize)) {
            console.error("[AYEDAS Upload] Prisma'ya gönderilmeden önce eksik/geçersiz alanlar:", documentData);
            // Geçici dosya oluştuysa sil
            try {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            catch (unlinkError) {
                console.error("Dosya silinirken hata oluştu:", unlinkError);
            }
            res.status(400).json({ success: false, message: 'Eksik veya geçersiz belge bilgileri.' });
            return;
        }
        // Belge oluştur
        const newDocument = yield prisma_1.prisma.edasNotificationDocument.create({
            data: documentData,
        });
        res.status(201).json({
            success: true,
            data: newDocument,
            message: "Belge başarıyla eklendi."
        });
    }
    catch (error) {
        console.error("[AYEDAS Upload] Belge eklenirken hata:", error);
        // Hata durumunda yüklenen dosyayı sil
        if (req.file) {
            try {
                if (fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
            }
            catch (unlinkError) {
                console.error("Hata durumunda dosya silinirken hata oluştu:", unlinkError);
            }
        }
        res.status(500).json({
            success: false,
            message: "Belge eklenirken bir sunucu hatası oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: AYEDAŞ bildirimi belgesini sil
router.delete('/ayedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params;
        console.log(`[AYEDAS Delete] Deleting document: ${documentId} for step ${stepId} of notification ${notificationId}`);
        // Belge var mı ve doğru AYEDAŞ adımına/bildirimine mi ait kontrol et
        const document = yield prisma_1.prisma.edasNotificationDocument.findFirst({
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
            console.log(`[AYEDAS Delete] Document not found or invalid context: ${documentId}`);
            res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen AYEDAŞ bildirim/adımına ait değil.`,
            });
            return;
        }
        // Dosya sisteminden belgeyi sil
        const filePath = path_1.default.join(__dirname, '..', '..', document.fileUrl); // Proje kök dizinine göre ayarla
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`[AYEDAS Delete] File deleted from filesystem: ${filePath}`);
            }
            else {
                console.warn(`[AYEDAS Delete] File not found on filesystem, proceeding with DB delete: ${filePath}`);
            }
        }
        catch (unlinkError) {
            console.error(`[AYEDAS Delete] Error deleting file from filesystem: ${filePath}`, unlinkError);
        }
        // Veritabanından belgeyi sil
        yield prisma_1.prisma.edasNotificationDocument.delete({
            where: { id: documentId },
        });
        console.log(`[AYEDAS Delete] Document deleted from DB: ${documentId}`);
        res.json({
            success: true,
            message: "Belge başarıyla silindi."
        });
    }
    catch (error) {
        console.error("[AYEDAS Delete] Belge silinirken hata:", error);
        if (error.code === 'P2025') { // Prisma: Kayıt bulunamadı hatası
            res.status(404).json({ success: false, message: 'Silinecek belge veritabanında bulunamadı.' });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Belge silinirken bir sunucu hatası oluştu.",
            error: error.message,
        });
    }
}));
// GET: AYEDAŞ bildirimi belgesini indir
router.get('/ayedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params;
        console.log(`[AYEDAS Download] Request for document: ${documentId}, step: ${stepId}, notification: ${notificationId}`);
        const document = yield prisma_1.prisma.edasNotificationDocument.findFirst({
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
            console.log(`[AYEDAS Download] Document not found or invalid context: ${documentId}`);
            res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen AYEDAŞ bildirim/adımına ait değil.`,
            });
            return;
        }
        // Gerçek dosya indirme mantığı
        const filePath = path_1.default.join(__dirname, '..', '..', document.fileUrl); // Proje kök dizinine göre ayarla
        console.log(`[AYEDAS Download] Attempting to send file: ${filePath}`);
        if (fs_1.default.existsSync(filePath)) {
            res.download(filePath, document.fileName, (err) => {
                if (err) {
                    console.error(`[AYEDAS Download] Error sending file: ${filePath}`, err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'Dosya gönderilirken bir hata oluştu.' });
                    }
                }
                else {
                    console.log(`[AYEDAS Download] File sent successfully: ${filePath} as ${document.fileName}`);
                }
            });
        }
        else {
            console.error(`[AYEDAS Download] File not found on server: ${filePath}`);
            res.status(404).json({ success: false, message: 'Dosya sunucuda bulunamadı.' });
        }
    }
    catch (error) {
        console.error("[AYEDAS Download] Belge indirilirken hata:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Belge indirilirken bir sunucu hatası oluştu.",
                error: error.message,
            });
        }
    }
}));
// BEDAŞ BİLDİRİM İŞLEMLERİ (AYEDAŞ ile benzer yapıda olmalı)
// GET: Tüm BEDAŞ bildirimlerini getir
router.get('/bedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma_1.prisma.edasNotification.findMany({
            where: { company: "BEDAŞ" }, // Filtre BEDAŞ olarak değiştirildi
            include: {
                steps: {
                    orderBy: {
                        stepType: 'asc'
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        console.log(`[BEDAS API] ${notifications.length} adet BEDAŞ bildirimi bulundu.`);
        res.json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        console.error("[BEDAS API] Bildirimler getirilirken hata:", error);
        res.status(500).json({
            success: false,
            message: "BEDAŞ bildirimleri getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// GET: Tek bir BEDAŞ bildirimini getir
router.get('/bedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma_1.prisma.edasNotification.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                    include: {
                        documents: true // Adımlara ait belgeleri de getir
                    }
                },
            },
        });
        if (!notification) {
            res.status(404).json({
                success: false,
                message: `${id} ID'li BEDAŞ bildirimi bulunamadı.`
            });
            return;
        }
        // Şirket kontrolü
        if (notification.company !== "BEDAŞ") {
            res.status(400).json({
                success: false,
                message: `${id} ID'li bildirim BEDAŞ'a ait değil.`
            });
            return;
        }
        console.log(`[BEDAS API] ${id} ID'li BEDAŞ bildirimi bulundu.`);
        res.json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        console.error(`[BEDAS API] ${req.params.id} ID'li BEDAŞ bildirimi getirilirken hata:`, error);
        res.status(500).json({
            success: false,
            message: "BEDAŞ bildirimi getirilirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: Yeni BEDAŞ bildirimi oluştur
router.post('/bedas/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const data = req.body;
        data.company = "BEDAŞ"; // Şirketi BEDAŞ olarak ayarla
        console.log("[BEDAS API] Yeni BEDAŞ bildirimi oluşturuluyor, veri:", data);
        // Eksik alanları kontrol et (örneğin, refNo zorunlu mu?)
        if (!data.refNo || !data.applicationType || !data.customerName) {
            return res.status(400).json({
                success: false,
                message: 'Eksik alanlar: refNo, applicationType, customerName zorunludur.'
            });
        }
        const newNotification = yield prisma_1.prisma.edasNotification.create({
            data: {
                company: data.company,
                refNo: data.refNo,
                applicationType: data.applicationType,
                status: 'PENDING', // Varsayılan durum
                currentStep: data.currentStep || "PROJE", // Varsayılan ilk adım (veya gelen değere göre)
                projectName: data.projectName, // Opsiyonel olabilir
                customerName: data.customerName,
                city: data.city, // Opsiyonel olabilir
                district: data.district, // Opsiyonel olabilir
                parcelBlock: data.parcelBlock, // Opsiyonel olabilir
                parcelNo: data.parcelNo, // Opsiyonel olabilir
            },
        });
        console.log(`[BEDAS API] Yeni BEDAŞ bildirimi başarıyla oluşturuldu: ${newNotification.id}`);
        res.status(201).json({
            success: true,
            data: newNotification,
            message: "BEDAŞ bildirimi başarıyla oluşturuldu."
        });
    }
    catch (error) {
        console.error("[BEDAS API] Yeni bildirim oluşturulurken hata:", error);
        // Prisma unique constraint hatasını kontrol et (örn: refNo zaten varsa)
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Bu referans numarası ile zaten bir bildirim mevcut.',
                error: `Alan(lar): ${(_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.join(', ')}`
            });
        }
        res.status(500).json({
            success: false,
            message: "Bildirim oluşturulurken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// POST: BEDAŞ bildirimine yeni adım ekle veya güncelle
router.post('/bedas/notifications/:notificationId/steps', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const { stepType, status, notes } = req.body;
        console.log(`[BEDAS API] Bildirim ${notificationId}, Adım ${stepType}, Durum ${status}`);
        // Bildirim var mı ve BEDAŞ'a mı ait kontrol et
        const notification = yield prisma_1.prisma.edasNotification.findFirst({
            where: {
                id: notificationId,
                company: "BEDAŞ" // Şirket kontrolü eklendi
            }
        });
        if (!notification) {
            res.status(404).json({ success: false, message: 'İlgili BEDAŞ bildirimi bulunamadı.' });
            return;
        }
        // Adım zaten var mı kontrol et
        let step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                notificationId: notificationId,
                stepType: stepType,
            },
        });
        let resultData;
        let statusCode = 200;
        let messageAction = 'güncellendi';
        if (step) {
            // Adım varsa güncelle
            console.log(`[BEDAS API] Adım ${stepType} güncelleniyor.`);
            step = yield prisma_1.prisma.edasNotificationStep.update({
                where: { id: step.id },
                data: { status, notes },
            });
            resultData = { step, notification };
        }
        else {
            // Adım yoksa oluştur
            console.log(`[BEDAS API] Adım ${stepType} oluşturuluyor.`);
            statusCode = 201;
            messageAction = 'oluşturuldu';
            step = yield prisma_1.prisma.edasNotificationStep.create({
                data: {
                    notificationId: notificationId,
                    stepType: stepType,
                    status: status,
                    notes: notes,
                },
            });
            resultData = { step, notification };
        }
        res.status(statusCode).json({
            success: true,
            data: resultData,
            message: `BEDAŞ Adım ${stepType} başarıyla ${messageAction}.`
        });
    }
    catch (error) {
        console.error("[BEDAS API] Adım işlenirken hata:", error);
        res.status(500).json({
            success: false,
            message: "BEDAŞ adımı işlenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// PUT: BEDAŞ adım durumu güncelleme
router.put('/bedas/notifications/:notificationId/steps/:stepId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const { status, notes } = req.body;
        console.log(`[BEDAS API] Step Update Request: notificationId=${notificationId}, stepId=${stepId}, status=${status}`);
        // Adım var mı ve doğru BEDAŞ bildirimine mi ait kontrol et
        const step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
                notification: {
                    company: "BEDAŞ"
                }
            }
        });
        if (!step) {
            console.log(`[BEDAS API] Step not found or does not belong to BEDAŞ: ${stepId}`);
            res.status(404).json({
                success: false,
                message: `${stepId} ID'li adım bulunamadı veya ilgili BEDAŞ bildirimine ait değil.`
            });
            return;
        }
        // Adımı güncelle
        const updatedStep = yield prisma_1.prisma.edasNotificationStep.update({
            where: { id: stepId },
            data: { status, notes },
            include: {
                notification: true
            }
        });
        console.log(`[BEDAS API] Step ${stepId} updated successfully.`);
        res.json({
            success: true,
            data: { step: updatedStep, notification: updatedStep.notification },
            message: "BEDAŞ adım durumu başarıyla güncellendi."
        });
    }
    catch (error) {
        console.error("[BEDAS API] Adım güncellenirken hata:", error);
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Güncellenecek BEDAŞ adımı bulunamadı.' });
            return;
        }
        res.status(500).json({
            success: false,
            message: "BEDAŞ adımı güncellenirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
// BEDAŞ BİLDİRİM BELGELERİ (Yeni Eklendi)
// POST: BEDAŞ bildiriminin adımına belge ekle
router.post('/bedas/notifications/:notificationId/steps/:stepId/documents', multer_middleware_1.upload.array('files'), // Birden fazla dosya için .array() kullan
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId } = req.params;
        const files = req.files; // Yüklenen dosyalar (dizi)
        const body = req.body; // Metin alanları (örneğin documentType)
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });
            return;
        }
        // Adım var mı ve BEDAŞ'a mı ait kontrol et
        const step = yield prisma_1.prisma.edasNotificationStep.findFirst({
            where: {
                id: stepId,
                notificationId: notificationId,
                notification: {
                    company: "BEDAŞ"
                }
            },
        });
        if (!step) {
            // Yüklenen tüm geçici dosyaları sil
            files.forEach(file => {
                try {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
                catch (unlinkError) {
                    console.error(`Dosya silinirken hata (${file.filename}):`, unlinkError);
                }
            });
            res.status(404).json({
                success: false,
                message: `${stepId} ID'li BEDAŞ adımı bulunamadı.`,
            });
            return;
        }
        console.log(`[BEDAS Upload] Received ${files.length} files for step ${stepId}`);
        console.log("[BEDAS Upload] Received body:", body); // documentType buradan alınacak
        const createdDocuments = [];
        for (const file of files) {
            // fileUrl'yi backend'de oluştur
            const generatedFileUrl = `/uploads/edas-documents/${file.filename}`;
            // Veritabanına kaydedilecek veriyi hazırla
            const documentData = {
                stepId: stepId,
                fileUrl: generatedFileUrl,
                originalName: file.originalname,
                fileName: file.filename,
                fileType: file.mimetype,
                fileSize: file.size,
                documentType: body.documentType || 'Diğer', // Frontend'den gelen documentType'ı kullan
            };
            // Alanların undefined/null olmadığını kontrol et
            if (!documentData.stepId || !documentData.fileUrl || !documentData.originalName || !documentData.fileName || !documentData.fileType || isNaN(documentData.fileSize) || !documentData.documentType) {
                console.error("[BEDAS Upload] Prisma'ya gönderilmeden önce eksik/geçersiz alanlar:", documentData);
                // Bu dosya için hata oluştu, ancak diğerlerini işlemeye devam edebiliriz veya tüm işlemi iptal edebiliriz.
                // Şimdilik bu dosyayı atlayıp loglayalım. Gerçek uygulamada daha sağlam bir hata yönetimi gerekir.
                console.error(`Skipping file due to missing data: ${file.originalname}`);
                // Geçici dosyayı sil
                try {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
                catch (unlinkError) {
                    console.error(`Dosya silinirken hata (${file.filename}):`, unlinkError);
                }
                continue; // Sonraki dosyaya geç
            }
            try {
                const newDocument = yield prisma_1.prisma.edasNotificationDocument.create({
                    data: documentData,
                });
                createdDocuments.push(newDocument);
            }
            catch (dbError) {
                console.error(`[BEDAS Upload] Veritabanına kaydederken hata (${file.originalname}):`, dbError);
                // Veritabanı hatası durumunda yüklenen dosyayı sil
                try {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
                catch (unlinkError) {
                    console.error(`DB hatası sonrası dosya silinirken hata (${file.filename}):`, unlinkError);
                }
                // Belki diğer dosyalar başarıyla kaydedildi, bu yüzden işlemi tamamen durdurmak yerine
                // sadece bu dosyanın hatasını loglamak daha iyi olabilir.
            }
        } // for döngüsü sonu
        // Başarılı bir şekilde oluşturulan belge yoksa ve en az bir dosya geldiyse hata döndür
        if (createdDocuments.length === 0 && files.length > 0) {
            res.status(400).json({
                success: false,
                message: "Belgeler işlenirken hata oluştu, hiçbiri kaydedilemedi."
            });
            return;
        }
        // En az bir belge başarıyla oluşturulduysa
        res.status(201).json({
            success: true,
            data: { documents: createdDocuments }, // Oluşturulan belgeleri döndür
            message: `${createdDocuments.length} adet belge başarıyla eklendi.`
        });
    }
    catch (error) {
        console.error("[BEDAS Upload] Belge eklenirken genel hata:", error);
        // Hata durumunda yüklenen tüm dosyaları silmeye çalış (eğer req.files varsa)
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(file => {
                try {
                    if (fs_1.default.existsSync(file.path)) {
                        fs_1.default.unlinkSync(file.path);
                    }
                }
                catch (unlinkError) {
                    console.error(`Genel hata sonrası dosya silinirken hata (${file.filename}):`, unlinkError);
                }
            });
        }
        res.status(500).json({
            success: false,
            message: "Belgeler eklenirken bir sunucu hatası oluştu.",
            error: error.message,
        });
    }
}));
// DELETE: BEDAŞ bildirimi belgesini sil
router.delete('/bedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params;
        console.log(`[BEDAS Delete] Deleting document: ${documentId} for step ${stepId} of notification ${notificationId}`);
        // Belge var mı ve doğru BEDAŞ adımına/bildirimine mi ait kontrol et
        const document = yield prisma_1.prisma.edasNotificationDocument.findFirst({
            where: {
                id: documentId,
                step: {
                    id: stepId,
                    notificationId: notificationId,
                    notification: {
                        company: "BEDAŞ"
                    }
                }
            }
        });
        if (!document) {
            console.log(`[BEDAS Delete] Document not found or invalid context: ${documentId}`);
            res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen BEDAŞ bildirim/adımına ait değil.`,
            });
            return;
        }
        // Dosya sisteminden belgeyi sil
        const filePath = path_1.default.join(__dirname, '..', '..', document.fileUrl); // Proje kök dizinine göre ayarla
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`[BEDAS Delete] File deleted from filesystem: ${filePath}`);
            }
            else {
                console.warn(`[BEDAS Delete] File not found on filesystem, proceeding with DB delete: ${filePath}`);
            }
        }
        catch (unlinkError) {
            console.error(`[BEDAS Delete] Error deleting file from filesystem: ${filePath}`, unlinkError);
        }
        // Veritabanından belgeyi sil
        yield prisma_1.prisma.edasNotificationDocument.delete({
            where: { id: documentId },
        });
        console.log(`[BEDAS Delete] Document deleted from DB: ${documentId}`);
        res.json({
            success: true,
            message: "Belge başarıyla silindi."
        });
    }
    catch (error) {
        console.error("[BEDAS Delete] Belge silinirken hata:", error);
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Silinecek belge veritabanında bulunamadı.' });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Belge silinirken bir sunucu hatası oluştu.",
            error: error.message,
        });
    }
}));
// GET: BEDAŞ bildirimi belgesini indir
router.get('/bedas/notifications/:notificationId/steps/:stepId/documents/:documentId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId, stepId, documentId } = req.params;
        console.log(`[BEDAS Download] Request for document: ${documentId}, step: ${stepId}, notification: ${notificationId}`);
        const document = yield prisma_1.prisma.edasNotificationDocument.findFirst({
            where: {
                id: documentId,
                step: {
                    id: stepId,
                    notificationId: notificationId,
                    notification: {
                        company: "BEDAŞ"
                    }
                }
            }
        });
        if (!document) {
            console.log(`[BEDAS Download] Document not found or invalid context: ${documentId}`);
            res.status(404).json({
                success: false,
                message: `${documentId} ID'li belge bulunamadı veya belirtilen BEDAŞ bildirim/adımına ait değil.`,
            });
            return;
        }
        // Gerçek dosya indirme mantığı
        const filePath = path_1.default.join(__dirname, '..', '..', document.fileUrl); // Proje kök dizinine göre ayarla
        console.log(`[BEDAS Download] Attempting to send file: ${filePath}`);
        if (fs_1.default.existsSync(filePath)) {
            res.download(filePath, document.fileName, (err) => {
                if (err) {
                    console.error(`[BEDAS Download] Error sending file: ${filePath}`, err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'Dosya gönderilirken bir hata oluştu.' });
                    }
                }
                else {
                    console.log(`[BEDAS Download] File sent successfully: ${filePath} as ${document.fileName}`);
                }
            });
        }
        else {
            console.error(`[BEDAS Download] File not found on server: ${filePath}`);
            res.status(404).json({ success: false, message: 'Dosya sunucuda bulunamadı.' });
        }
    }
    catch (error) {
        console.error("[BEDAS Download] Belge indirilirken hata:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Belge indirilirken bir sunucu hatası oluştu.",
                error: error.message,
            });
        }
    }
}));
// DELETE: BEDAŞ bildirimini sil
router.delete('/bedas/notifications/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[BEDAS API] ${id} ID'li BEDAŞ bildirimi siliniyor...`);
        // Bildirimin varlığını ve BEDAŞ'a ait olduğunu kontrol et (opsiyonel ama iyi pratik)
        const notification = yield prisma_1.prisma.edasNotification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: `${id} ID'li bildirim bulunamadı.`,
            });
        }
        if (notification.company !== "BEDAŞ") {
            return res.status(400).json({
                success: false,
                message: `${id} ID'li bildirim BEDAŞ'a ait değil, silinemez.`
            });
        }
        // Prisma schema'da cascade delete tanımlıysa ilişkili veriler otomatik silinir.
        // Tanımlı değilse, önce adımları ve belgeleri manuel silmek gerekebilir:
        // await prisma.edasNotificationDocument.deleteMany({ where: { step: { notificationId: id } } });
        // await prisma.edasNotificationStep.deleteMany({ where: { notificationId: id } });
        yield prisma_1.prisma.edasNotification.delete({
            where: { id },
        });
        console.log(`[BEDAS API] ${id} ID'li BEDAŞ bildirimi başarıyla silindi.`);
        // Başarılı silme işleminde 204 No Content döndürmek daha standarttır.
        res.status(204).send(); // Yanıt gövdesi gönderme
    }
    catch (error) {
        console.error(`[BEDAS API] ${req.params.id} ID'li bildirim silinirken hata:`, error);
        // P2025: Silinmeye çalışılan kayıt bulunamadı.
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: `${req.params.id} ID'li bildirim bulunamadı.`,
            });
            return;
        }
        // Diğer hatalar
        res.status(500).json({
            success: false,
            message: "Bildirim silinirken bir hata oluştu.",
            error: error.message,
        });
    }
}));
exports.default = router;
