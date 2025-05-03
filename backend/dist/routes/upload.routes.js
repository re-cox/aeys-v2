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
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const router = express_1.default.Router();
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
/**
 * @route POST /api/uploads
 * @desc Dosya yükleme
 * @access Private
 */
router.post('/', auth_middleware_1.authenticate, upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı' });
        }
        // Kullanıcı bilgilerini al
        const userId = req.user.id;
        // Dosya URL'ini oluştur
        const fileUrl = `/uploads/${req.file.filename}`;
        // Yanıt oluştur
        const response = {
            success: true,
            data: {
                fileUrl,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                userId
            }
        };
        console.log(`[Upload API] Dosya yüklendi: ${req.file.originalname}, URL: ${fileUrl}`);
        return res.status(201).json(response);
    }
    catch (error) {
        console.error('[Upload API] Dosya yükleme hatası:', error);
        return (0, errorHandler_1.default)(error, req, res);
    }
}));
/**
 * @route GET /api/uploads/:filename
 * @desc Dosya indirme
 * @access Public
 */
router.get('/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        // Dosyanın var olup olmadığını kontrol et
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }
        // Dosyayı gönder
        return res.sendFile(filePath);
    }
    catch (error) {
        console.error('[Upload API] Dosya indirme hatası:', error);
        return (0, errorHandler_1.default)(error, req, res);
    }
});
/**
 * @route DELETE /api/uploads/:filename
 * @desc Dosya silme
 * @access Private
 */
router.delete('/:filename', auth_middleware_1.authenticate, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        // Dosyanın var olup olmadığını kontrol et
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }
        // Dosyayı sil
        fs_1.default.unlinkSync(filePath);
        return res.json({
            success: true,
            message: 'Dosya başarıyla silindi'
        });
    }
    catch (error) {
        console.error('[Upload API] Dosya silme hatası:', error);
        return (0, errorHandler_1.default)(error, req, res);
    }
});
exports.default = router;
