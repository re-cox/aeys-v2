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
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Tüm rotalar için kimlik doğrulama gerekli
router.use(auth_middleware_1.authenticate);
// Yükleme dizinini oluştur
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer konfigürasyonu
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueFileName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueFileName);
    }
});
// Dosya boyutu sınırı: 50MB
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Tüm dosya türlerine izin ver, gerekirse burada filtreleme yapılabilir
        cb(null, true);
    }
});
// GET /api/documents
router.get('/', document_controller_1.getAllDocuments);
// GET /api/documents/:id
router.get('/:id', document_controller_1.getDocumentById);
// POST /api/documents
router.post('/', document_controller_1.createDocument);
// PUT /api/documents/:id
router.put('/:id', document_controller_1.updateDocument);
// DELETE /api/documents/:id
router.delete('/:id', document_controller_1.deleteDocument);
// GET /api/documents/:id/download
router.get('/:id/download', document_controller_1.downloadDocument);
// POST /api/documents/upload - Doküman yükleme endpoint'i
router.post('/upload', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı' });
        }
        // Kullanıcı bilgilerini al
        const userId = req.user.id;
        // Dosya URL'ini oluştur
        const fileUrl = `/uploads/${req.file.filename}`;
        // Form verilerinden diğer bilgileri al
        const { name, description, category, folderId } = req.body;
        // Doküman veritabanı kaydını oluştur
        const document = yield prisma.document.create({
            data: {
                name: name || req.file.originalname,
                description: description || '',
                fileUrl,
                type: 'file',
                size: req.file.size,
                mimeType: req.file.mimetype,
                category: category || null,
                folderId: folderId === 'root' ? null : folderId || null,
                createdById: userId
            }
        });
        console.log(`[Document API] Doküman yüklendi: ${name || req.file.originalname}, URL: ${fileUrl}`);
        return res.status(201).json(document);
    }
    catch (error) {
        console.error('[Document API] Doküman yükleme hatası:', error);
        return res.status(500).json({
            error: 'Doküman yüklenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
}));
exports.default = router;
