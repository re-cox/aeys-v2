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
 * @route GET /api/folders
 * @desc Tüm klasörleri listele (filtreleme seçenekli)
 * @access Private
 */
router.get('/', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, parentId } = req.query;
        // Filtreleme koşulları
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (parentId === 'root' || parentId === 'null') {
            // Kök klasörleri getir (parentId null olanlar)
            where.parentId = null;
        }
        else if (parentId) {
            // Belirli bir üst klasörün alt klasörlerini getir
            where.parentId = parentId;
        }
        // Klasörleri getir
        const folders = yield prisma.folder.findMany({
            where,
            include: {
                children: true,
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            },
            orderBy: {
                name: 'asc',
            },
        });
        res.json(folders);
    }
    catch (error) {
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route GET /api/folders/:id
 * @desc ID'ye göre klasör detaylarını getir
 * @access Private
 */
router.get('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const folder = yield prisma.folder.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                documents: {
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı.' });
        }
        res.json(folder);
    }
    catch (error) {
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route GET /api/folders/root/contents
 * @desc Kök klasör içeriğini getir (ana klasörler ve dokümanlar)
 * @access Private
 */
router.get('/root/contents', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[Folders API] Kök klasör içeriği GET isteği alındı.`);
        // Veritabanı bağlantısını test et
        try {
            yield prisma.$queryRaw `SELECT 1 as connection_test`;
            console.log('[Folders API] Veritabanı bağlantısı başarılı.');
        }
        catch (connError) {
            console.error('[Folders API] Veritabanı bağlantı hatası:', connError);
            return res.status(500).json({
                error: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.',
                details: connError instanceof Error ? connError.message : 'Bilinmeyen bağlantı hatası',
                folders: [],
                documents: []
            });
        }
        // Ana klasörleri getir (parentId null olanlar)
        const rootFolders = yield prisma.folder.findMany({
            where: {
                parentId: null
            },
            orderBy: {
                name: 'asc',
            },
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            }
        });
        // Hiçbir klasöre ait olmayan dokümanları getir
        const rootDocuments = yield prisma.document.findMany({
            where: {
                folderId: null
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json({
            folders: rootFolders,
            documents: rootDocuments
        });
    }
    catch (error) {
        console.error(`[Folders API] Kök klasör içeriği GET hatası:`, error);
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route GET /api/folders/:id/contents
 * @desc Klasör içeriğini getir (alt klasörler ve dokümanlar)
 * @access Private
 */
router.get('/:id/contents', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log(`[Folders API] Contents GET isteği alındı. ID: ${id}`);
        // Veritabanı bağlantısını test et
        try {
            yield prisma.$queryRaw `SELECT 1 as connection_test`;
            console.log('[Folders API] Veritabanı bağlantısı başarılı.');
        }
        catch (connError) {
            console.error('[Folders API] Veritabanı bağlantı hatası:', connError);
            return res.status(500).json({
                error: 'Veritabanına bağlanırken hata oluştu. Lütfen sistem yöneticinize başvurun.',
                details: connError instanceof Error ? connError.message : 'Bilinmeyen bağlantı hatası',
                folders: [],
                documents: []
            });
        }
        // Önce klasör varlığını kontrol et
        const folderExists = yield prisma.folder.findUnique({
            where: { id }
        });
        if (!folderExists) {
            console.log(`[Folders API] Klasör bulunamadı. ID: ${id}`);
            return res.status(404).json({
                error: 'Belirtilen klasör bulunamadı.',
                folders: [],
                documents: []
            });
        }
        // Alt klasörleri getir
        const subFolders = yield prisma.folder.findMany({
            where: {
                parentId: id
            },
            orderBy: {
                name: 'asc',
            },
            include: {
                _count: {
                    select: {
                        documents: true,
                        children: true
                    }
                }
            }
        });
        console.log(`[Folders API] ${subFolders.length} alt klasör bulundu.`);
        // Dokümanları getir
        const documents = yield prisma.document.findMany({
            where: {
                folderId: id
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`[Folders API] ${documents.length} doküman bulundu.`);
        console.log(`[Folders API] Klasör içeriği başarıyla alındı. ID: ${id}`);
        res.json({
            folders: subFolders,
            documents: documents
        });
    }
    catch (error) {
        console.error(`[Folders API] Genel Contents GET hatası (ID: ${req.params.id}):`, error);
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route POST /api/folders
 * @desc Yeni klasör oluştur
 * @access Private
 */
router.post('/', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, parentId, color, icon } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Klasör adı zorunludur.' });
        }
        const folder = yield prisma.folder.create({
            data: {
                name,
                description,
                parentId: parentId === 'null' ? null : parentId,
                color,
                icon,
                createdById: req.user.id,
            },
        });
        res.status(201).json(folder);
    }
    catch (error) {
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route PUT /api/folders/:id
 * @desc Klasör güncelle
 * @access Private
 */
router.put('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, parentId, color, icon } = req.body;
        // Klasör varlığını kontrol et
        const folderExists = yield prisma.folder.findUnique({
            where: { id },
        });
        if (!folderExists) {
            return res.status(404).json({ error: 'Klasör bulunamadı.' });
        }
        const updatedFolder = yield prisma.folder.update({
            where: { id },
            data: {
                name,
                description,
                parentId: parentId === 'null' ? null : parentId,
                color,
                icon,
                updatedAt: new Date(),
            },
        });
        res.json(updatedFolder);
    }
    catch (error) {
        (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route DELETE /api/folders/:id
 * @desc Klasör sil
 * @access Private
 */
router.delete('/:id', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Klasör varlığını kontrol et
        const folderExists = yield prisma.folder.findUnique({
            where: { id },
        });
        if (!folderExists) {
            return res.status(404).json({ error: 'Klasör bulunamadı.' });
        }
        // Alt klasörleri kontrol et
        const subFolders = yield prisma.folder.findMany({
            where: { parentId: id },
        });
        if (subFolders.length > 0) {
            return res.status(400).json({
                error: 'Bu klasör içinde alt klasörler bulunmaktadır. Önce alt klasörleri silmelisiniz.'
            });
        }
        // Klasördeki dokümanları kontrol et
        const documents = yield prisma.document.findMany({
            where: { folderId: id },
        });
        if (documents.length > 0) {
            return res.status(400).json({
                error: 'Bu klasör içinde dokümanlar bulunmaktadır. Önce dokümanları silmelisiniz veya başka klasöre taşımalısınız.'
            });
        }
        // Klasörü sil
        yield prisma.folder.delete({
            where: { id },
        });
        res.status(200).json({ message: 'Klasör başarıyla silindi.' });
    }
    catch (error) {
        (0, errorHandler_1.default)(error, req, res);
    }
}));
exports.default = router;
