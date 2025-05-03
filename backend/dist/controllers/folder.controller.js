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
exports.deleteFolder = exports.updateFolder = exports.createFolder = exports.getFolderContents = exports.getRootContents = exports.getFolderById = exports.getAllFolders = void 0;
const client_1 = require("@prisma/client");
const errorLogger_1 = require("../utils/errorLogger");
const prisma = new client_1.PrismaClient();
/**
 * Tüm klasörleri listele
 * GET /api/folders
 */
const getAllFolders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parentId = req.query.parentId;
        const where = {};
        if (parentId === 'root' || parentId === 'null') {
            where.parentId = null;
        }
        else if (parentId) {
            where.parentId = parentId;
        }
        const folders = yield prisma.folder.findMany({
            where,
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json(folders);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)('Klasörler listelenirken hata', error);
        return res.status(500).json({
            error: 'Klasörler listelenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getAllFolders = getAllFolders;
/**
 * Belirli bir klasörün detaylarını getir
 * GET /api/folders/:id
 */
const getFolderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const folder = yield prisma.folder.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    orderBy: {
                        name: 'asc'
                    }
                },
                documents: {
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }
        return res.status(200).json(folder);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Klasör detayları getirilirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Klasör detayları getirilirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getFolderById = getFolderById;
/**
 * Kök klasör içeriğini getir
 * GET /api/folders/root/contents
 */
const getRootContents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[Folder Controller] Kök klasör içeriği isteniyor');
        // Ana klasörleri getir (parentId null olanlar)
        const folders = yield prisma.folder.findMany({
            where: {
                parentId: null
            },
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        // Hiçbir klasöre ait olmayan dokümanlar
        const documents = yield prisma.document.findMany({
            where: {
                folderId: null
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log(`[Folder Controller] Kök klasör içeriği: ${folders.length} klasör, ${documents.length} doküman`);
        return res.status(200).json({
            folders,
            documents
        });
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)('Kök klasör içeriği getirilirken hata', error);
        return res.status(500).json({
            error: 'Kök klasör içeriği getirilirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getRootContents = getRootContents;
/**
 * Belirli bir klasörün içeriğini getir
 * GET /api/folders/:id/contents
 */
const getFolderContents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[Folder Controller] Klasör içeriği isteniyor: ${id}`);
        // Klasörün varlığını kontrol et
        const folderExists = yield prisma.folder.findUnique({
            where: { id }
        });
        if (!folderExists) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }
        // Alt klasörleri getir
        const folders = yield prisma.folder.findMany({
            where: {
                parentId: id
            },
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        // Klasöre ait dokümanları getir
        const documents = yield prisma.document.findMany({
            where: {
                folderId: id
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log(`[Folder Controller] Klasör içeriği: ${folders.length} klasör, ${documents.length} doküman`);
        return res.status(200).json({
            folders,
            documents
        });
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Klasör içeriği getirilirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Klasör içeriği getirilirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.getFolderContents = getFolderContents;
/**
 * Yeni klasör oluştur
 * POST /api/folders
 */
const createFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, parentId } = req.body;
        // Basit doğrulama
        if (!name) {
            return res.status(400).json({ error: 'Klasör adı zorunludur' });
        }
        // Kullanıcı ID'sini al
        const createdById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!createdById) {
            return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bilgileri eksik' });
        }
        // Klasörü oluştur
        const folder = yield prisma.folder.create({
            data: {
                name,
                description,
                parentId: parentId === 'root' ? null : parentId,
                createdById
            }
        });
        return res.status(201).json(folder);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)('Klasör oluşturulurken hata', error);
        return res.status(500).json({
            error: 'Klasör oluşturulurken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.createFolder = createFolder;
/**
 * Klasörü güncelle
 * PUT /api/folders/:id
 */
const updateFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, parentId } = req.body;
        // Basit doğrulama
        if (!name) {
            return res.status(400).json({ error: 'Klasör adı zorunludur' });
        }
        // Klasör varlığını kontrol et
        const exists = yield prisma.folder.findUnique({
            where: { id }
        });
        if (!exists) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }
        // Döngüsel ilişki kontrolü
        if (parentId && parentId !== 'root' && parentId !== null) {
            if (parentId === id) {
                return res.status(400).json({ error: 'Klasör kendisini içeremez' });
            }
            // Alt klasörlerin ebeveyn olarak ayarlanması kontrolü
            // UYARI: Büyük klasör ağaçlarında performans problemi olabilir
            const checkCycle = (currentId, targetId) => __awaiter(void 0, void 0, void 0, function* () {
                if (currentId === targetId)
                    return true;
                const childFolders = yield prisma.folder.findMany({
                    where: { parentId: currentId },
                    select: { id: true }
                });
                for (const child of childFolders) {
                    if (yield checkCycle(child.id, targetId))
                        return true;
                }
                return false;
            });
            if (yield checkCycle(id, parentId)) {
                return res.status(400).json({ error: 'Döngüsel klasör ilişkisi oluşturulamaz' });
            }
        }
        // Klasörü güncelle
        const folder = yield prisma.folder.update({
            where: { id },
            data: {
                name,
                description,
                parentId: parentId === 'root' ? null : parentId
            }
        });
        return res.status(200).json(folder);
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Klasör güncellenirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Klasör güncellenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.updateFolder = updateFolder;
/**
 * Klasörü sil
 * DELETE /api/folders/:id
 */
const deleteFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        // Klasör varlığını kontrol et
        const folder = yield prisma.folder.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        children: true,
                        documents: true
                    }
                }
            }
        });
        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }
        // Alt klasör ve doküman kontrolü
        if (((_a = folder._count) === null || _a === void 0 ? void 0 : _a.children) > 0) {
            return res.status(400).json({ error: 'Alt klasörler içeren klasör silinemez. Önce alt klasörleri taşıyın veya silin.' });
        }
        if (((_b = folder._count) === null || _b === void 0 ? void 0 : _b.documents) > 0) {
            return res.status(400).json({ error: 'Doküman içeren klasör silinemez. Önce dokümanları taşıyın veya silin.' });
        }
        // Klasörü sil
        yield prisma.folder.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Klasör başarıyla silindi' });
    }
    catch (error) {
        (0, errorLogger_1.errorLogger)(`Klasör silinirken hata (ID: ${req.params.id})`, error);
        return res.status(500).json({
            error: 'Klasör silinirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});
exports.deleteFolder = deleteFolder;
