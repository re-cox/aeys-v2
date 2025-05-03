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
exports.downloadDocument = exports.deleteDocument = exports.updateDocument = exports.createDocument = exports.getDocumentById = exports.getAllDocuments = void 0;
const client_1 = require("@prisma/client");
const errorLogger_1 = require("../utils/errorLogger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
/**
 * Tüm dokümanları listele
 * GET /api/documents
 */
const getAllDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { folderId, type, category, search } = req.query;
        // Filtreleme kriterleri oluştur
        const where = {};
        if (folderId === 'root' || folderId === 'null') {
            where.folderId = null;
        }
        else if (folderId) {
            where.folderId = folderId;
        }
        if (type) {
            where.type = type;
        }
        if (category) {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const documents = yield prisma.document.findMany({
            where,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                folder: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json(documents);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)('Dokümanlar listelenirken hata', error);
        return res.status(500).json({
            error: 'Dokümanlar listelenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getAllDocuments = getAllDocuments;
/**
 * Belirli bir dokümanın detaylarını getir
 * GET /api/documents/:id
 */
const getDocumentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const document = yield prisma.document.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                folder: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        return res.status(200).json(document);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Doküman detayları getirilirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Doküman detayları getirilirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getDocumentById = getDocumentById;
/**
 * Yeni doküman oluştur
 * POST /api/documents
 */
const createDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, fileUrl, type, size, mimeType, category, folderId } = req.body;
        // Basit doğrulama
        if (!name) {
            return res.status(400).json({ error: 'Doküman adı zorunludur' });
        }
        // Kullanıcı ID'sini al
        const createdById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!createdById) {
            return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bilgileri eksik' });
        }
        // Dokümanı oluştur
        const document = yield prisma.document.create({
            data: {
                name,
                description,
                fileUrl,
                type: type || 'file',
                size: size ? Number(size) : 0,
                mimeType,
                category,
                folderId: folderId === 'root' ? null : folderId,
                createdById
            }
        });
        return res.status(201).json(document);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)('Doküman oluşturulurken hata', error);
        return res.status(500).json({
            error: 'Doküman oluşturulurken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.createDocument = createDocument;
/**
 * Dokümanı güncelle
 * PUT /api/documents/:id
 */
const updateDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, type, category, folderId } = req.body;
        // Doküman varlığını kontrol et
        const exists = yield prisma.document.findUnique({
            where: { id }
        });
        if (!exists) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        // Dokümanı güncelle
        const document = yield prisma.document.update({
            where: { id },
            data: {
                name,
                description,
                type,
                category,
                folderId: folderId === 'root' ? null : folderId
            }
        });
        return res.status(200).json(document);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Doküman güncellenirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Doküman güncellenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.updateDocument = updateDocument;
/**
 * Dokümanı sil
 * DELETE /api/documents/:id
 */
const deleteDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Doküman varlığını kontrol et
        const document = yield prisma.document.findUnique({
            where: { id }
        });
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        // Fiziksel dosya varsa silmeye çalış (opsiyonel)
        if (document.fileUrl) {
            try {
                const filePath = path_1.default.join(process.cwd(), 'uploads', document.fileUrl.replace(/^\/uploads\//, ''));
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    console.log(`Dosya silindi: ${filePath}`);
                }
            }
            catch (fileError) {
                console.error('Dosya silinirken hata:', fileError);
                // Dosya silme hatası durumunda bile işleme devam edilebilir
            }
        }
        // Dokümanı sil
        yield prisma.document.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Doküman başarıyla silindi' });
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Doküman silinirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Doküman silinirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.deleteDocument = deleteDocument;
/**
 * Dokümanı indir
 * GET /api/documents/:id/download
 */
const downloadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Doküman bilgilerini getir
        const document = yield prisma.document.findUnique({
            where: { id }
        });
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        if (!document.fileUrl) {
            return res.status(400).json({ error: 'Doküman için dosya bulunamadı' });
        }
        // Dosya yolunu oluştur
        const filePath = path_1.default.join(process.cwd(), 'uploads', document.fileUrl.replace(/^\/uploads\//, ''));
        // Dosyanın varlığını kontrol et
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }
        // Content-disposition header ayarla
        const filename = document.name || path_1.default.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        // MIME tipini ayarla
        if (document.mimeType) {
            res.setHeader('Content-Type', document.mimeType);
        }
        // Dosyayı stream olarak gönder
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Doküman indirilirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Doküman indirilirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.downloadDocument = downloadDocument;
