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
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
/**
 * @route GET /api/documents
 * @desc Tüm dokümanları listele (filtreleme seçenekli)
 * @access Private
 */
router.get('/', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, folderId } = req.query;
        // Filtreleme koşulları
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (folderId === 'root' || folderId === 'null') {
            // Kök klasördeki dokümanlar (folderId null olanlar)
            where.folderId = null;
        }
        else if (folderId) {
            // Belirli bir klasördeki dokümanlar
            where.folderId = folderId;
        }
        const documents = yield prisma.document.findMany({
            where,
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            data: documents,
            count: documents.length
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route GET /api/documents/:id
 * @desc Belirli bir dokümanı getir
 * @access Private
 */
router.get('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const document = yield prisma.document.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        return res.json({
            success: true,
            data: document
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route POST /api/documents
 * @desc Yeni bir doküman oluştur
 * @access Private
 */
router.post('/', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, content, fileUrl, folderId, type, size, mimeType } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Doküman adı gereklidir' });
        }
        // Kullanıcı id'sini request'ten al
        const userId = req.user.id;
        const document = yield prisma.document.create({
            data: {
                name,
                description: description || '',
                content: content || '',
                fileUrl: fileUrl || null,
                folderId: folderId === 'null' ? null : folderId || null,
                type: type || 'text',
                size: size || 0,
                mimeType: mimeType || 'text/plain',
                createdById: userId,
            },
        });
        return res.status(201).json({
            success: true,
            data: document
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route PUT /api/documents/:id
 * @desc Dokümanı güncelle
 * @access Private
 */
router.put('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, content, fileUrl, folderId, type, size, mimeType } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Doküman adı gereklidir' });
        }
        // Dokümanın var olup olmadığını kontrol et
        const existingDocument = yield prisma.document.findUnique({
            where: { id },
        });
        if (!existingDocument) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        const document = yield prisma.document.update({
            where: { id },
            data: {
                name,
                description: description || existingDocument.description,
                content: content !== undefined ? content : existingDocument.content,
                fileUrl: fileUrl !== undefined ? fileUrl : existingDocument.fileUrl,
                folderId: folderId === 'null' ? null : (folderId || existingDocument.folderId),
                type: type || existingDocument.type,
                size: size || existingDocument.size,
                mimeType: mimeType || existingDocument.mimeType,
                updatedAt: new Date(),
            },
        });
        return res.json({
            success: true,
            data: document
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route DELETE /api/documents/:id
 * @desc Dokümanı sil
 * @access Private
 */
router.delete('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Dokümanın var olup olmadığını kontrol et
        const existingDocument = yield prisma.document.findUnique({
            where: { id },
        });
        if (!existingDocument) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }
        yield prisma.document.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Doküman başarıyla silindi'
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
exports.default = router;
